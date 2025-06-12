const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 's21_bembre_prathamesh@mgmcen.ac.in',
    pass: 'ufnabnaonuxkyhxv'
  }
});

const mailOptions = {
  from: 's21_bembre_prathamesh@mgmcen.ac.in',
  to: 's21_bembre_prathamesh@mgmcen.ac.in', // send to your own email for testing
  subject: 'Test Email from Node.js',
  text: 'This is a test email sent using nodemailer and your app password!'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error:', error);
  }
  console.log('Email sent:', info.response);
}); 