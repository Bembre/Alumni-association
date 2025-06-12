const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const MentorshipGroup = require('../models/MentorshipGroup');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at:', uploadDir);
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('File upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but add timestamp to prevent duplicates
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  // Accept images, documents, and other common file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size too large',
        details: 'Maximum file size is 5MB'
      });
    }
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message
    });
  }
  
  if (err.message) {
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message
    });
  }
  
  next(err);
};

// Start mentorship with selected students
router.post('/start', auth, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const mentorEmail = req.user.email;

    console.log('Starting mentorship with:', { mentorEmail, studentIds });

    if (!mentorEmail) {
      console.error('No mentor email found in request');
      return res.status(401).json({ error: 'User email not found in request' });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      console.error('Invalid studentIds:', studentIds);
      return res.status(400).json({ error: 'No students selected' });
    }

    // Find the alumni profile
    const alumniProfile = await Alumni.findOne({ email: mentorEmail });
    console.log('Found alumni profile:', alumniProfile ? 'yes' : 'no');
    
    if (!alumniProfile) {
      console.error('Alumni profile not found for email:', mentorEmail);
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    // Get the students
    const students = await Student.find({ _id: { $in: studentIds } });
    console.log('Found students:', students.length, 'out of', studentIds.length);
    
    if (students.length !== studentIds.length) {
      console.error('Some students not found. Found:', students.length, 'Expected:', studentIds.length);
      return res.status(400).json({ error: 'One or more students not found' });
    }

    try {
      // Create mentorship groups for each student
      for (const student of students) {
        try {
          // Check if mentorship already exists
          const existingMentorship = await MentorshipGroup.findOne({
            mentor: alumniProfile._id,
            student: student._id
          });

          console.log('Checking existing mentorship for student:', student._id, 'Found:', existingMentorship ? 'yes' : 'no');

          if (!existingMentorship) {
            // Create new mentorship group
            await MentorshipGroup.create({
              mentor: alumniProfile._id,
              student: student._id,
              status: 'active',
              startDate: new Date()
            });

            // Update student status
            student.mentorship_status = 'Mentored';
            student.mentor = alumniProfile._id;
            student.mentorship_start_date = new Date();
            await student.save();
            
            // Update alumni's assigned_students array
            alumniProfile.assigned_students.push({
              student: student._id,
              start_date: new Date(),
              status: 'active'
            });
            
            console.log('Created new mentorship for student:', student._id);
          }
        } catch (studentError) {
          console.error('Error processing student:', student._id, studentError);
          throw studentError;
        }
      }

      // Update alumni profile
      const activeMentorships = await MentorshipGroup.countDocuments({
        mentor: alumniProfile._id,
        status: 'active'
      });
      
      console.log('Updating alumni profile. Active mentorships:', activeMentorships);
      
      alumniProfile.current_students = activeMentorships;
      alumniProfile.mentorship_status = activeMentorships >= alumniProfile.max_students ? 'Full' : 'Available';
      await alumniProfile.save();

      console.log('Mentorship setup completed successfully');
    } catch (error) {
      console.error('Error in mentorship setup:', error);
      throw error;
    }

    // Return the updated list of mentored students with their mentor details
    const mentoredStudents = await Student.find({
      _id: { $in: studentIds }
    })
    .select('-password')
    .populate('mentor', 'first_name last_name email department skills');

    console.log('Returning mentored students:', mentoredStudents.length);
    res.json(mentoredStudents);
  } catch (error) {
    console.error('Detailed error in /start endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to start mentorship. Please try again.',
      details: error.message
    });
  }
});

// Get mentorship groups for an alumni
router.get('/groups', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const alumniEmail = req.user.email;
    const alumni = await Alumni.findOne({ email: alumniEmail })
      .populate('assigned_students.student');
    
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    res.json({
      alumni: {
        name: `${alumni.first_name} ${alumni.last_name}`,
        current_students: alumni.current_students,
        max_students: alumni.max_students,
        mentorship_status: alumni.mentorship_status
      },
      students: alumni.assigned_students.map(assignment => ({
        id: assignment.student._id,
        name: `${assignment.student.first_name} ${assignment.student.last_name}`,
        email: assignment.student.email,
        department: assignment.student.department,
        course: assignment.student.course,
        current_year: assignment.student.current_year,
        start_date: assignment.start_date,
        status: assignment.status
      }))
    });

  } catch (error) {
    console.error('Error fetching mentorship groups:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship groups' });
  }
});

// Get available students for mentorship
router.get('/available-students', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const alumni = await Alumni.findOne({ email: req.user.email });
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    // If alumni is full, return empty list
    if (alumni.mentorship_status === 'Full') {
      return res.json([]);
    }

    // Find students who are available for mentorship
    const students = await Student.find({
      mentorship_status: 'Available',
      profileCompleted: true
    }).select('-password');

    res.json(students);
  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({ error: 'Failed to fetch available students' });
  }
});

// Select a student for mentorship
router.post('/select-student', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const { studentId } = req.body;
    const alumniId = req.user._id;

    // Check if alumni has reached the maximum limit
    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni not found' });
    }

    // Get current number of mentees
    const currentMentees = await Student.countDocuments({ mentor: alumniId });
    if (currentMentees >= 3) {
      return res.status(400).json({ error: 'Maximum number of mentees reached' });
    }

    // Update student's mentorship status
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.mentorship_status !== 'Available') {
      return res.status(400).json({ error: 'Student is not available for mentorship' });
    }

    student.mentorship_status = 'In Progress';
    student.mentor = alumniId;
    await student.save();

    res.json({ message: 'Student selected successfully', student });
  } catch (error) {
    console.error('Error selecting student:', error);
    res.status(500).json({ error: 'Failed to select student' });
  }
});

// Get alumni's current mentees
router.get('/mentees', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const mentees = await Student.find({ mentor: req.user._id })
      .select('-password')
      .populate('mentor', 'first_name last_name email');

    res.json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    res.status(500).json({ error: 'Failed to fetch mentees' });
  }
});

// Get messages for a mentorship group
router.get('/messages', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    let messages;
    const studentId = req.query.studentId;

    if (userRole === 'alumni') {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) {
        return res.status(404).json({ error: 'Alumni profile not found' });
      }
      // Only fetch personal messages for the selected student
      if (!studentId) return res.status(400).json({ error: 'studentId is required for personal chat' });
      messages = await Message.find({
        mentor: alumni._id,
        student: studentId,
        isGroup: { $ne: true },
        isDeleted: false
      })
      .sort({ timestamp: 1 })
      .populate('student', 'first_name last_name')
      .populate('mentor', 'first_name last_name')
      .populate('reactions.user', 'first_name last_name');
    } else if (userRole === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      messages = await Message.find({
        student: student._id,
        isGroup: { $ne: true },
        isDeleted: false
      })
      .sort({ timestamp: 1 })
      .populate('student', 'first_name last_name')
      .populate('mentor', 'first_name last_name')
      .populate('reactions.user', 'first_name last_name');
    }

    res.json(messages.map(msg => ({
      _id: msg._id,
      message: msg.content,
      senderName:
        msg.senderRole === 'alumni'
          ? `${msg.mentor.first_name} ${msg.mentor.last_name}`
          : `${msg.student.first_name} ${msg.student.last_name}`,
      senderRole: msg.senderRole,
      timestamp: msg.timestamp,
      file: msg.file ? {
        id: msg.file.id,
        name: msg.file.name,
        type: msg.file.type,
        size: msg.file.size
      } : null,
      reactions: msg.reactions.map(reaction => ({
        emoji: reaction.emoji,
        user: reaction.user.first_name + ' ' + reaction.user.last_name,
        timestamp: reaction.timestamp
      }))
    })));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message in a mentorship group
router.post('/messages', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('Received message request:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    const { message, studentId } = req.body;
    const userRole = req.user.role;

    // Only alumni require studentId
    if (userRole === 'alumni' && !studentId) {
      console.error('Missing studentId in request');
      return res.status(400).json({ error: 'Student ID is required' });
    }

    let newMessage;

    if (userRole === 'alumni') {
      console.log('Processing alumni message');
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) {
        console.error('Alumni profile not found for email:', req.user.email);
        return res.status(404).json({ error: 'Alumni profile not found' });
      }

      // Validate that the student is being mentored by this alumni
      const student = await Student.findOne({
        _id: studentId,
        mentor: alumni._id
      });

      if (!student) {
        console.error('Invalid student-mentor relationship:', {
          studentId,
          mentorId: alumni._id
        });
        return res.status(400).json({ error: 'Invalid student selection' });
      }

      // Create message for specific student
      const messageData = {
        content: message || '',
        mentor: alumni._id,
        student: studentId,
        senderRole: 'alumni',
        timestamp: new Date(),
        isGroup: false
      };

      // Add file data if a file was uploaded
      if (req.file) {
        console.log('Adding file data to message:', {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        messageData.file = {
          id: req.file.filename,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size
        };
      }

      console.log('Creating message with data:', messageData);
      newMessage = await Message.create(messageData);
      console.log('Created new message:', newMessage);

      // Populate the created message
      newMessage = await Message.populate(newMessage, [
        { path: 'student', select: 'first_name last_name' },
        { path: 'mentor', select: 'first_name last_name' }
      ]);
    } else if (userRole === 'student') {
      console.log('Processing student message');
      const student = await Student.findOne({ email: req.user.email });
      if (!student) {
        console.error('Student profile not found for email:', req.user.email);
        return res.status(404).json({ error: 'Student profile not found' });
      }

      if (!student.mentor) {
        console.error('No mentor assigned to student:', student._id);
        return res.status(400).json({ error: 'No mentor assigned' });
      }

      // Create message for the student's mentor
      const messageData = {
        content: message || '',
        mentor: student.mentor,
        student: student._id,
        senderRole: 'student',
        timestamp: new Date(),
        isGroup: false
      };

      // Add file data if a file was uploaded
      if (req.file) {
        console.log('Adding file data to message:', {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        messageData.file = {
          id: req.file.filename,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size
        };
      }

      console.log('Creating message with data:', messageData);
      newMessage = await Message.create(messageData);
      newMessage = await Message.populate(newMessage, [
        { path: 'student', select: 'first_name last_name' },
        { path: 'mentor', select: 'first_name last_name' }
      ]);
    } else {
      // If neither alumni nor student, reject
      return res.status(400).json({ error: 'Invalid user role' });
    }

    const responseData = {
      message: 'Message sent successfully',
      newMessage: {
        _id: newMessage._id,
        message: newMessage.content,
        senderName: newMessage.senderRole === 'alumni' ? 
          `${newMessage.mentor.first_name} ${newMessage.mentor.last_name}` : 
          `${newMessage.student.first_name} ${newMessage.student.last_name}`,
        senderRole: newMessage.senderRole,
        timestamp: newMessage.timestamp,
        file: newMessage.file ? {
          id: newMessage.file.id,
          name: newMessage.file.name,
          type: newMessage.file.type,
          size: newMessage.file.size
        } : null
      }
    };

    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error sending message:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
  }
});

// Add reaction to a message
router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const userRole = req.user.role;
    const userModel = userRole === 'alumni' ? 'Alumni' : 'Student';
    const user = await mongoose.model(userModel).findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove existing reaction from this user if any
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: user._id,
      userModel,
      emoji,
      timestamp: new Date()
    });

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if the user is the sender of the message
    if (message.senderRole === 'alumni') {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni || message.mentor.toString() !== alumni._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }
    } else if (message.senderRole === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (!student || message.student.toString() !== student._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }
    }

    // Soft delete the message
    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get a file
router.get('/files/:fileId', auth, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.fileId);
    console.log('Attempting to fetch file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File stats:', {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to send file' });
      }
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file',
      details: error.message,
      stack: error.stack
    });
  }
});

// Get available mentors (alumni who can mentor)
router.get('/available-mentors', auth, async (req, res) => {
  try {
    const alumni = await Alumni.find({ mentorship_status: 'Available' })
      .select('first_name last_name department skills experience profile skillset email profile')
      .lean();

    res.json(alumni);
  } catch (error) {
    console.error('Error fetching available mentors:', error);
    res.status(500).json({ message: 'Error fetching available mentors' });
  }
});

// Get student's assigned mentor
router.get('/student/mentor', auth, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email })
      .populate('mentor', 'first_name last_name department skills experience profile')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.mentor) {
      return res.status(404).json({ message: 'No mentor assigned' });
    }

    res.json(student.mentor);
  } catch (error) {
    console.error('Error fetching mentor:', error);
    res.status(500).json({ message: 'Error fetching mentor' });
  }
});

// --- GROUP CHAT SUPPORT ---
// Get group messages for a mentorship group (alumni or student)
router.get('/group-messages', auth, async (req, res) => {
  try {
    let alumniId, menteeIds;
    if (req.user.role === 'alumni') {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
      alumniId = alumni._id;
      menteeIds = (await Student.find({ mentor: alumni._id })).map(s => s._id);
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (!student || !student.mentor) return res.status(404).json({ error: 'Student or mentor not found' });
      alumniId = student.mentor;
      menteeIds = (await Student.find({ mentor: alumniId })).map(s => s._id);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Fetch all group messages between alumni and any of their mentees
    const messages = await Message.find({
      mentor: alumniId,
      student: { $in: menteeIds },
      isGroup: true,
      isDeleted: false
    }).sort({ timestamp: 1 })
      .populate('student', 'first_name last_name')
      .populate('mentor', 'first_name last_name');
    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Send a group message (alumni or student to all in group)
router.post('/group-messages', auth, async (req, res) => {
  try {
    const { message } = req.body;
    let alumniId, senderRole, senderId;
    if (req.user.role === 'alumni') {
      const alumni = await Alumni.findOne({ email: req.user.email });
      if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
      alumniId = alumni._id;
      senderRole = 'alumni';
      senderId = alumni._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (!student || !student.mentor) return res.status(404).json({ error: 'Student or mentor not found' });
      alumniId = student.mentor;
      senderRole = 'student';
      senderId = student._id;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const mentees = await Student.find({ mentor: alumniId });
    if (!mentees.length) return res.status(400).json({ error: 'No mentees to send group message' });
    // Send the message to each mentee (if alumni) or to all mentees and alumni (if student)
    let recipients = mentees.map(m => m._id);
    if (senderRole === 'student') {
      // Also send to the alumni (so alumni sees the message in group chat)
      recipients.push(alumniId);
    }
    const createdMessages = await Promise.all(recipients.map(async (recipientId) => {
      return await Message.create({
        content: message,
        mentor: alumniId,
        student: recipientId,
        senderRole,
        timestamp: new Date(),
        isGroup: true
      });
    }));
    res.json({ message: 'Group message sent', count: createdMessages.length });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// ADMIN: Get all alumni with assigned students, and unassigned alumni/students
router.get('/admin/assignments', auth, checkRole(['admin']), async (req, res) => {
  try {
    // Get all alumni
    const alumni = await Alumni.find().populate('assigned_students.student');
    // Get all students
    const students = await Student.find();

    // Alumni with assigned students
    const alumniWithAssignments = alumni.map(alum => ({
      _id: alum._id,
      first_name: alum.first_name,
      last_name: alum.last_name,
      email: alum.email,
      assigned_students: (alum.assigned_students || [])
        .filter(asg => asg.student)
        .map(asg => ({
          _id: asg.student._id,
          first_name: asg.student.first_name,
          last_name: asg.student.last_name,
          email: asg.student.email,
          department: asg.student.department,
          current_year: asg.student.current_year,
          status: asg.status,
          start_date: asg.start_date
        }))
    }));

    // Unassigned alumni: no assigned students
    const unassignedAlumni = alumni.filter(alum => !alum.assigned_students || alum.assigned_students.length === 0)
      .map(alum => ({
        _id: alum._id,
        first_name: alum.first_name,
        last_name: alum.last_name,
        email: alum.email
      }));

    // Unassigned students: no mentor
    const unassignedStudents = students.filter(stu => !stu.mentor)
      .map(stu => ({
        _id: stu._id,
        first_name: stu.first_name,
        last_name: stu.last_name,
        email: stu.email,
        department: stu.department,
        current_year: stu.current_year
      }));

    res.json({
      alumniWithAssignments,
      unassignedAlumni,
      unassignedStudents
    });
  } catch (error) {
    console.error('Error fetching mentorship assignments for admin:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship assignments' });
  }
});

// ADMIN: Assign a student to an alumni
router.post('/admin/assign', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { studentId, alumniId } = req.body;
    if (!studentId || !alumniId) return res.status(400).json({ error: 'studentId and alumniId are required' });
    const alumni = await Alumni.findById(alumniId);
    const student = await Student.findById(studentId);
    if (!alumni || !student) return res.status(404).json({ error: 'Alumni or Student not found' });
    // Check if already assigned
    if (student.mentor && student.mentor.toString() === alumniId) {
      return res.status(400).json({ error: 'Student already assigned to this alumni' });
    }
    // Assign
    student.mentor = alumni._id;
    student.mentorship_status = 'Mentored';
    student.mentorship_start_date = new Date();
    await student.save();
    alumni.assigned_students = alumni.assigned_students || [];
    alumni.assigned_students.push({ student: student._id, start_date: new Date(), status: 'active' });
    alumni.current_students = (alumni.current_students || 0) + 1;
    alumni.mentorship_status = alumni.current_students >= (alumni.max_students || 3) ? 'Full' : 'Available';
    await alumni.save();
    // Remove from other alumni if needed
    await Alumni.updateMany({ _id: { $ne: alumni._id } }, { $pull: { assigned_students: { student: student._id } } });
    // Return updated assignments
    const assignments = await getAdminAssignments();
    res.json(assignments);
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Failed to assign student' });
  }
});

// ADMIN: Unassign a student from an alumni
router.post('/admin/unassign', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { studentId, alumniId } = req.body;
    if (!studentId || !alumniId) return res.status(400).json({ error: 'studentId and alumniId are required' });
    const alumni = await Alumni.findById(alumniId);
    const student = await Student.findById(studentId);
    if (!alumni || !student) return res.status(404).json({ error: 'Alumni or Student not found' });
    // Unassign
    student.mentor = undefined;
    student.mentorship_status = 'Available';
    student.mentorship_start_date = undefined;
    await student.save();
    alumni.assigned_students = (alumni.assigned_students || []).filter(asg => asg.student.toString() !== studentId);
    alumni.current_students = Math.max((alumni.current_students || 1) - 1, 0);
    alumni.mentorship_status = alumni.current_students >= (alumni.max_students || 3) ? 'Full' : 'Available';
    await alumni.save();
    // Return updated assignments
    const assignments = await getAdminAssignments();
    res.json(assignments);
  } catch (error) {
    console.error('Error unassigning student:', error);
    res.status(500).json({ error: 'Failed to unassign student' });
  }
});

// Helper to get admin assignments
async function getAdminAssignments() {
  const alumni = await Alumni.find().populate('assigned_students.student');
  const students = await Student.find();
  const alumniWithAssignments = alumni.map(alum => ({
    _id: alum._id,
    first_name: alum.first_name,
    last_name: alum.last_name,
    email: alum.email,
    assigned_students: (alum.assigned_students || [])
      .filter(asg => asg.student)
      .map(asg => ({
        _id: asg.student._id,
        first_name: asg.student.first_name,
        last_name: asg.student.last_name,
        email: asg.student.email,
        department: asg.student.department,
        current_year: asg.student.current_year,
        status: asg.status,
        start_date: asg.start_date
      }))
  }));
  const unassignedAlumni = alumni.filter(alum => !alum.assigned_students || alum.assigned_students.length === 0)
    .map(alum => ({
      _id: alum._id,
      first_name: alum.first_name,
      last_name: alum.last_name,
      email: alum.email
    }));
  const unassignedStudents = students.filter(stu => !stu.mentor)
    .map(stu => ({
      _id: stu._id,
      first_name: stu.first_name,
      last_name: stu.last_name,
      email: stu.email,
      department: stu.department,
      current_year: stu.current_year
    }));
  return { alumniWithAssignments, unassignedAlumni, unassignedStudents };
}

module.exports = router; 