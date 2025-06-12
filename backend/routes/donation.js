const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const DonationTransaction = require('../models/DonationTransaction');
const Fund = require('../models/Fund');
const Alumni = require('../models/Alumni');
const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Alumni: Submit a donation transaction
router.post('/submit', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const { campaignId, amount, upiRef } = req.body;
    const alumni = await Alumni.findById(req.user.userId);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    const campaign = await Fund.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const transaction = new DonationTransaction({
      campaign: campaignId,
      alumni: alumni._id,
      name: alumni.first_name + ' ' + alumni.last_name,
      email: alumni.email,
      amount,
      upiRef,
      status: 'confirmed'
    });
    await transaction.save();
    // Update campaign raised amount
    campaign.raised = Number(campaign.raised) + Number(amount);
    campaign.amount = Number(campaign.amount);
    let campaignDeleted = false;
    let updatedRaised = campaign.raised;
    if (campaign.raised >= campaign.amount) {
      await Fund.findByIdAndDelete(campaignId);
      console.log(`[DEBUG] Deleted campaign ${campaignId} after reaching goal: raised=${campaign.raised}, amount=${campaign.amount}`);
      campaignDeleted = true;
    } else {
      await campaign.save();
    }
    // Generate PDF receipt with logo and improved format
    const doc = new PDFDocument();
    const receiptPath = path.join(__dirname, `../receipts/receipt_${transaction._id}.pdf`);
    if (!fs.existsSync(path.dirname(receiptPath))) fs.mkdirSync(path.dirname(receiptPath));
    doc.pipe(fs.createWriteStream(receiptPath));
    // Add logo
    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { fit: [80, 80], align: 'center' });
      doc.moveDown();
    }
    doc.fontSize(22).text('Official Donation Receipt', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(14).text(`Donor Name: ${alumni.first_name} ${alumni.last_name}`);
    doc.text(`Email: ${alumni.email}`);
    doc.text(`Campaign: ${campaign.title}`);
    doc.text(`Amount: ₹${amount}`);
    doc.text(`UPI Reference: ${upiRef}`);
    doc.text(`Transaction ID: ${transaction._id}`);
    doc.moveDown();
    doc.fontSize(13).text('Thank you for your generous support! Your contribution is greatly appreciated.', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text('MGM Alumni Association', { align: 'center' });
    doc.text('Contact: alumni@mgmcen.ac.in | www.mgmcen.ac.in', { align: 'center' });
    doc.moveDown();
    doc.fontSize(9).text('This is a computer-generated receipt and does not require a signature.', { align: 'center', oblique: true });
    doc.end();
    // Fallback for alumni name
    const alumniName = (alumni.first_name && alumni.last_name) ? `${alumni.first_name} ${alumni.last_name}` : alumni.email;
    // Create transporter once for both alumni and admin emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    // Debug log for alumni approval and email
    console.log(`[DEBUG] Alumni for donation:`, alumni);
    if (alumni.isApproved !== false && alumni.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: alumni.email,
          subject: `Thank You for Your Donation to ${campaign.title}!`,
          text: `Dear ${alumniName},\n\nThank you for your generous donation of ₹${amount} to the \"${campaign.title}\" campaign.\n\nYour support helps us achieve our goals and make a real difference. Please find your official donation receipt attached to this email.\n\nDonation Details:\n- Campaign: ${campaign.title}\n- Amount: ₹${amount}\n- UPI Reference: ${upiRef}\n- Date: ${new Date().toLocaleString()}\n\nIf you have any questions, feel free to contact us at alumni@mgmcen.ac.in.\n\nWith gratitude,\nMGM Alumni Association`,
          html: `<div style='font-family: Arial, sans-serif; color: #222;'>
            <h2 style='color: #1a2a6c;'>Thank You for Your Donation!</h2>
            <p>Dear <b>${alumniName}</b>,</p>
            <p>Thank you for your generous donation of <b>₹${amount}</b> to the <b>“${campaign.title}”</b> campaign.</p>
            <p>Your support helps us achieve our goals and make a real difference. Please find your official donation receipt attached to this email.</p>
            <h4>Donation Details:</h4>
            <ul>
              <li><b>Campaign:</b> ${campaign.title}</li>
              <li><b>Amount:</b> ₹${amount}</li>
              <li><b>UPI Reference:</b> ${upiRef}</li>
              <li><b>Date:</b> ${new Date().toLocaleString()}</li>
            </ul>
            <p>If you have any questions, feel free to contact us at <a href='mailto:alumni@mgmcen.ac.in'>alumni@mgmcen.ac.in</a>.</p>
            <p style='margin-top:2em;'>With gratitude,<br/><b>MGM Alumni Association</b></p>
            <hr/>
            <small style='color:#888;'>MGM Alumni Association | www.mgmcen.ac.in</small>
          </div>`,
          attachments: [{ filename: `receipt_${transaction._id}.pdf`, path: receiptPath }]
        });
        console.log(`[DEBUG] Alumni donation email sent to: ${alumni.email}`);
      } catch (emailErr) {
        console.error('[DEBUG] Failed to send alumni donation email:', emailErr);
      }
    } else {
      console.warn(`[DEBUG] Alumni not approved or missing email. isApproved: ${alumni.isApproved}, email: ${alumni.email}`);
    }
    // Email notification to admin (HTML email)
    const admin = await Admin.findOne();
    if (admin && admin.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: `New Donation Received: ${alumni.first_name} ${alumni.last_name}`,
          text: `A new donation has been received.\n\nDonor: ${alumni.first_name} ${alumni.last_name}\nEmail: ${alumni.email}\nCampaign: ${campaign.title}\nAmount: ₹${amount}\nUPI Reference: ${upiRef}\nDate: ${new Date().toLocaleString()}\n\nYou can view this donation in the admin dashboard.\n\nBest regards,\nMGM Alumni Association System`,
          html: `<div style='font-family: Arial, sans-serif; color: #222;'>
            <h2 style='color: #b21f1f;'>New Donation Received</h2>
            <p><b>Donor:</b> ${alumni.first_name} ${alumni.last_name}<br/>
            <b>Email:</b> ${alumni.email}<br/>
            <b>Campaign:</b> ${campaign.title}<br/>
            <b>Amount:</b> ₹${amount}<br/>
            <b>UPI Reference:</b> ${upiRef}<br/>
            <b>Date:</b> ${new Date().toLocaleString()}</p>
            <p>You can view this donation in the <a href='http://localhost:3000/admin'>admin dashboard</a>.</p>
            <hr/>
            <small style='color:#888;'>MGM Alumni Association System</small>
          </div>`
        });
        console.log(`[DEBUG] Admin donation email sent to: ${admin.email}`);
      } catch (adminEmailErr) {
        console.error('[DEBUG] Failed to send admin donation email:', adminEmailErr);
      }
    }
    res.status(201).json({ 
      message: 'Donation submitted successfully', 
      transaction, 
      receiptUrl: `/api/donation/receipt/${transaction._id}`,
      campaignDeleted,
      raised: updatedRaised
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve PDF receipt
router.get('/receipt/:transactionId', auth, async (req, res) => {
  try {
    const receiptPath = path.join(__dirname, `../receipts/receipt_${req.params.transactionId}.pdf`);
    if (!fs.existsSync(receiptPath)) return res.status(404).send('Receipt not found');
    res.download(receiptPath);
  } catch (error) {
    res.status(500).send('Error downloading receipt');
  }
});

// Admin: View all donation transactions
router.get('/transactions', auth, checkRole(['admin']), async (req, res) => {
  try {
    const transactions = await DonationTransaction.find().populate('campaign').populate('alumni').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alumni: View their own donations
router.get('/my', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const transactions = await DonationTransaction.find({ alumni: req.user.userId }).populate('campaign').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alumni: Fallback - Email admin if transaction not found
router.post('/email-admin', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const { campaignId, amount, upiRef } = req.body;
    const alumni = await Alumni.findById(req.user.userId);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    const campaign = await Fund.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: admin.email,
      subject: 'Donation Payment Submitted (Fallback)',
      text: `Alumni ${alumni.first_name} ${alumni.last_name} (${alumni.email}) has submitted a donation for campaign "${campaign.title}".\nAmount: ₹${amount}\nUPI Ref: ${upiRef}\nPlease verify and update the transaction.`
    });
    res.json({ message: 'Email sent to admin for manual verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Notify admin of a manual UPI donation
router.post('/notify-admin', async (req, res) => {
  try {
    const { name, email, amount } = req.body;
    if (!name || !email || !amount) {
      return res.status(400).json({ error: 'Name, email, and amount are required.' });
    }
    const adminEmail = 's21_bembre_prathamesh@mgmcen.ac.in';
    const upiId = 'prathameshbembre01@oksbi';
    const accountHolder = 'Prathamesh Kailash Bembre';
    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: 'Alumni Donation Received via UPI',
      text: `A donation has been reported by an alumni.\n\nName: ${name}\nEmail: ${email}\nAmount: ₹${amount}\n\nThe payment was made to:\nUPI ID: ${upiId}\nAccount Holder: ${accountHolder}\n\nPlease verify the payment in your UPI app.`
    });
    res.json({ message: 'Notification email sent to admin.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 