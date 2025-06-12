const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Event = require('../models/Event');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Create event (admin and alumni)
router.post('/add', auth, checkRole(['admin', 'alumni']), async (req, res) => {
  try {
    const { 
      type, 
      title, 
      description, 
      date, 
      time, 
      venue, 
      link, 
      maxParticipants,
      expiryDate,
      batches
    } = req.body;

    // Get organizer info based on role
    let organizerInfo;
    let organizerModel;

    if (req.user.role === 'admin') {
      const admin = await Admin.findOne({ email: req.user.email });
      if (!admin) {
        return res.status(404).json({ error: 'Admin profile not found' });
      }
      organizerInfo = {
        userId: admin._id,
        name: admin.name || 'Admin',
        email: admin.email,
        organizerModel: 'Admin'
      };
      organizerModel = 'Admin';
    } else {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) {
        return res.status(404).json({ error: 'Alumni profile not found' });
      }
      organizerInfo = {
        userId: alumni._id,
        name: `${alumni.first_name || ''} ${alumni.last_name || ''}`.trim() || 'Alumni',
        email: alumni.email,
        organizerModel: 'Alumni'
      };
      organizerModel = 'Alumni';
    }

    // Calculate expiry date if not provided
    const calculatedExpiryDate = expiryDate ? new Date(expiryDate) : new Date(date);
    if (!expiryDate) {
      // Default expiry is midnight on the event date
      calculatedExpiryDate.setHours(23, 59, 59);
    }

    // Only allow batch invitations for reunion events
    let batchesToInvite = [];
    if (type === 'reunion' && batches && Array.isArray(batches) && batches.length > 0) {
      batchesToInvite = batches;
    }

    const event = new Event({
      type,
      title,
      description,
      date: new Date(date),
      time,
      venue: venue || null,
      link: link || null,
      expiryDate: calculatedExpiryDate,
      organizer: organizerInfo,
      maxParticipants: maxParticipants || null,
      batches: batchesToInvite.length > 0 ? batchesToInvite : undefined
    });

    await event.save();

    let emailsSent = 0;
    // Send batch invitations only for reunion events
    if (type === 'reunion' && batchesToInvite.length > 0) {
      const alumniList = await Alumni.find({ passing_year: { $in: batchesToInvite } });
      if (alumniList.length > 0) {
        // Setup nodemailer transporter (example with Gmail, replace with your SMTP)
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        for (const alum of alumniList) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: alum.email,
            subject: `You're Invited: ${event.title} for Batch of ${alum.passing_year}`,
            text: `Dear ${alum.first_name || 'Alumni'},\n\nYou are invited to a ${event.type} organized by ${organizerInfo.name} for the Batch of ${alum.passing_year}.\n\nVenue: ${event.venue || 'Online'}\nDate: ${event.date}\nTime: ${event.time}\n\nWe look forward to seeing you!\n\nRegards,\nAlumni Association Team`
          };
          try {
            await transporter.sendMail(mailOptions);
            emailsSent++;
          } catch (err) {
            console.error('Email error:', err);
          }
        }
      }
    }
    // Send webinar invitation to all alumni
    else if (type === 'webinar') {
      const alumniList = await Alumni.find({});
      if (alumniList.length > 0) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        for (const alum of alumniList) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: alum.email,
            subject: `Webinar Invitation: ${event.title}`,
            text: `Dear ${alum.first_name || 'Alumni'},\n\nYou are invited to a webinar organized by ${organizerInfo.name}.\n\nTitle: ${event.title}\nDescription: ${event.description}\nDate: ${event.date}\nTime: ${event.time}\nWebinar Link: ${event.link}\n\nWe look forward to seeing you!\n\nRegards,\nAlumni Association Team`
          };
          try {
            await transporter.sendMail(mailOptions);
            emailsSent++;
          } catch (err) {
            console.error('Email error:', err);
          }
        }
      }
    }
    res.status(201).json({ message: `Event created${(type === 'reunion' || type === 'webinar') ? ` and invitations sent to ${emailsSent} alumni` : ''}`, event, emailsSent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all active events
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({ expiryDate: { $gte: today } })
      .sort({ date: 1 });
    
    // Add isRegistered field for the requesting user
    const eventsWithRegistrationStatus = events.map(event => {
      const eventObj = event.toObject();
      // Use req.user.email instead of req.user.id for identifying the user
      // We'll need to look up the user by email first
      if (req.user && req.user.email) {
        try {
          // Check participation based on user's email rather than ID
          eventObj.isRegistered = event.participants.some(p => 
            p.email === req.user.email
          );
        } catch (err) {
          console.error('Error checking participant status:', err);
          eventObj.isRegistered = false;
        }
      } else {
        eventObj.isRegistered = false;
      }
      return eventObj;
    });
    
    res.json(eventsWithRegistrationStatus);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get past events
router.get('/past', auth, async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({ expiryDate: { $lt: today } })
      .sort({ date: -1 }); // Most recent first
    res.json(events);
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Add registration status for the requesting user
    const eventObj = event.toObject();
    // Use req.user.email instead of req.user.id for identifying the user
    if (req.user && req.user.email) {
      try {
        // Check participation based on user's email rather than ID
        eventObj.isRegistered = event.participants.some(p => 
          p.email === req.user.email
        );
      } catch (err) {
        console.error('Error checking participant status:', err);
        eventObj.isRegistered = false;
      }
    } else {
      eventObj.isRegistered = false;
    }
    
    res.json(eventObj);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register for an event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if event is expired
    if (new Date() > event.expiryDate) {
      return res.status(400).json({ error: 'Event registration has expired' });
    }
    
    // Check if event is full
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event has reached maximum participants' });
    }
    
    // Check if user already registered
    if (event.participants.some(p => p.email === req.user.email)) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }
    
    // Get user details based on role
    let userInfo;
    let participantModel;
    
    if (req.user.role === 'alumni') {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) {
        return res.status(404).json({ error: 'Alumni profile not found' });
      }
      userInfo = {
        userId: alumni._id,
        name: `${alumni.first_name || ''} ${alumni.last_name || ''}`.trim() || 'Alumni User',
        email: alumni.email,
        participantModel: 'Alumni'
      };
      participantModel = 'Alumni';
    } else {
      const student = await Student.findOne({ email: req.user.email });
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      userInfo = {
        userId: student._id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student User',
        email: student.email,
        participantModel: 'Student'
      };
      participantModel = 'Student';
    }
    
    // Add user to participants
    event.participants.push(userInfo);
    await event.save();
    
    res.json({ 
      success: true, 
      message: 'Successfully registered for the event',
      participantCount: event.participants.length
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel registration for an event
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if event is expired
    if (new Date() > event.expiryDate) {
      return res.status(400).json({ error: 'Event has already expired' });
    }
    
    // Check if user is registered
    const participantIndex = event.participants.findIndex(
      p => p.email === req.user.email
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ error: 'You are not registered for this event' });
    }
    
    // Remove user from participants
    event.participants.splice(participantIndex, 1);
    await event.save();
    
    res.json({ 
      success: true, 
      message: 'Successfully cancelled registration',
      participantCount: event.participants.length
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get participants for an event (only organizer and admin)
router.get('/:id/participants', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if user is the organizer or an admin
    const isOrganizer = event.organizer.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view participants' });
    }
    
    res.json({
      success: true,
      participants: event.participants,
      totalParticipants: event.participants.length
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events organized by the current user
router.get('/my/organized', auth, checkRole(['admin', 'alumni']), async (req, res) => {
  try {
    const events = await Event.find({
      'organizer.userId': req.user.id
    }).sort({ date: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching organized events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events registered by the current user
router.get('/my/registered', auth, async (req, res) => {
  try {
    const events = await Event.find({
      'participants.userId': req.user.id
    }).sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event (only organizer and admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // Check if user is the organizer or an admin
    const isOrganizer = event.organizer.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    // Fields that can be updated
    const {
      title,
      description,
      date,
      time,
      venue,
      link,
      expiryDate,
      status,
      maxParticipants
    } = req.body;
    
    // Update fields if provided
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (time) event.time = time;
    if (venue) event.venue = venue;
    if (link) event.link = link;
    if (expiryDate) event.expiryDate = new Date(expiryDate);
    if (status) event.status = status;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event (only organizer and admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // Check if user is the organizer or an admin
    const isOrganizer = event.organizer.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin delete event route
router.delete('/admin/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully (admin)' });
  } catch (error) {
    console.error('Error deleting event (admin):', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 