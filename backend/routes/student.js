const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Student = require('../models/Student');

// Get student profile
router.get('/profile', auth, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email })
      .select('-password'); // all fields are included except password
    
    if (!student) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update student profile
router.put('/profile', auth, checkRole(['student']), async (req, res) => {
  try {
    const {
      profile,
      department,
      course,
      first_name,
      middle_name,
      last_name,
      dob,
      gender,
      current_year,
      phone,
      alt_phone,
      student_id,
      current_address,
      permanent_address,
      experience,
      skillset,
      projects,
      achievements,
      education
    } = req.body;

    // Validate required fields
    const requiredFields = {
      department,
      course,
      first_name,
      last_name,
      dob,
      gender,
      current_year,
      phone,
      current_address,
      permanent_address
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Find student
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update fields
    const updateData = {
      profile,
      department,
      course,
      first_name,
      middle_name,
      last_name,
      dob: new Date(dob),
      gender,
      current_year,
      phone,
      alt_phone,
      student_id,
      current_address,
      permanent_address,
      profileCompleted: true
    };

    // Only add experience if it's provided and not empty
    if (experience && Array.isArray(experience)) {
      updateData.experience = experience;
    }

    // Only add skillset if provided and not empty
    if (skillset && Array.isArray(skillset)) {
      updateData.skillset = skillset;
    }

    // Only add projects if provided and not empty
    if (projects && Array.isArray(projects)) {
      updateData.projects = projects;
    }

    // Only add achievements if provided and not empty
    if (achievements && Array.isArray(achievements)) {
      updateData.achievements = achievements;
    }

    // Only add education if provided and not empty
    if (education && Array.isArray(education)) {
      updateData.education = education;
    }

    // Update student
    Object.assign(student, updateData);
    await student.save();

    // Return updated profile without password
    const updatedStudent = student.toObject();
    delete updatedStudent.password;
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get student's mentor details
router.get('/mentor', auth, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email })
      .populate({
        path: 'mentor',
        select: '-password',
        populate: {
          path: 'skills',
          model: 'Skill'
        }
      });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.mentor) {
      return res.status(404).json({ error: 'No mentor assigned' });
    }

    res.json({
      mentorship_status: student.mentorship_status,
      mentorship_start_date: student.mentorship_start_date,
      mentorship_end_date: student.mentorship_end_date,
      mentorship_notes: student.mentorship_notes,
      mentor: {
        _id: student.mentor._id,
        first_name: student.mentor.first_name,
        last_name: student.mentor.last_name,
        email: student.mentor.email,
        department: student.mentor.department,
        skills: student.mentor.skills,
        profile: student.mentor.profile
      }
    });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    res.status(500).json({ error: 'Failed to fetch mentor details' });
  }
});

// Get student's mentorship history
router.get('/mentorship-history', auth, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email })
      .select('mentorship_status mentorship_start_date mentorship_end_date mentorship_notes');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      mentorship_status: student.mentorship_status,
      mentorship_start_date: student.mentorship_start_date,
      mentorship_end_date: student.mentorship_end_date,
      mentorship_notes: student.mentorship_notes
    });
  } catch (error) {
    console.error('Error fetching mentorship history:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship history' });
  }
});

// Get all students (for alumni mentorship)
router.get('/all', auth, checkRole(['alumni']), async (req, res) => {
  try {
    console.log('Fetching all students for alumni:', req.user.email);
    
    const students = await Student.find()
      .select('-password')
      .limit(20);
    
    console.log(`Found ${students.length} students`);
    
    // Log detailed information about each student
    students.forEach(student => {
      const studentInfo = {
        id: student._id,
        name: `${student.first_name || 'N/A'} ${student.last_name || 'N/A'}`,
        email: student.email,
        department: student.department || 'N/A',
        course: student.course || 'N/A',
        mentorship_status: student.mentorship_status || 'Available'
      };
      console.log('Student details:', studentInfo);
    });

    // Transform the response to ensure all fields have default values
    const transformedStudents = students.map(student => ({
      ...student.toObject(),
      first_name: student.first_name || 'N/A',
      last_name: student.last_name || 'N/A',
      department: student.department || 'N/A',
      course: student.course || 'N/A',
      mentorship_status: student.mentorship_status || 'Available'
    }));

    res.json(transformedStudents);
  } catch (error) {
    console.error('Error in /all students route:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 