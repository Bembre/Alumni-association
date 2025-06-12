const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Alumni = require('../models/Alumni');

// Get alumni profile
router.get('/profile', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const alumni = await Alumni.findOne({ email: req.user.email })
      .select('-password');
    
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    res.json(alumni);
  } catch (error) {
    console.error('Error fetching alumni profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update alumni profile
router.put('/profile', auth, checkRole(['alumni']), async (req, res) => {
  try {
    console.log('--------- Profile Update Request ---------');
    console.log('User:', req.user);
    console.log('Body keys:', Object.keys(req.body));
    
    const {
      first_name,
      middle_name,
      last_name,
      dob,
      gender,
      phone,
      alt_phone,
      current_address,
      permanent_address,
      department,
      course,
      passing_year,
      current_company,
      designation,
      current_location,
      joined_date,
      skillset,
      projects,
      achievements,
      profile,
      profileCompleted,
      experience,
      education
    } = req.body;

    // Clean up the _id field if present
    if (req.body._id) {
      console.log('Removing _id field from request');
    }

    console.log('Experience:', JSON.stringify(experience || [], null, 2));
    console.log('Education:', JSON.stringify(education || [], null, 2));
    
    // Handle dates carefully
    let parsedDob = dob;
    if (dob && typeof dob === 'string') {
      try {
        parsedDob = new Date(dob);
        if (isNaN(parsedDob.getTime())) {
          console.warn('Invalid DOB date format:', dob);
          parsedDob = null;
        }
      } catch (e) {
        console.error('Error parsing DOB:', e);
        parsedDob = null;
      }
    }
    
    let parsedJoinedDate = joined_date;
    if (joined_date && typeof joined_date === 'string') {
      try {
        parsedJoinedDate = new Date(joined_date);
        if (isNaN(parsedJoinedDate.getTime())) {
          console.warn('Invalid joined_date format:', joined_date);
          parsedJoinedDate = null;
        }
      } catch (e) {
        console.error('Error parsing joined_date:', e);
        parsedJoinedDate = null;
      }
    }
    
    // Handle passing_year field - ensure it's a number
    let parsedPassingYear = passing_year;
    if (passing_year && typeof passing_year === 'string') {
      // If it's in YYYY-MM format, extract just the year
      if (passing_year.includes('-')) {
        parsedPassingYear = parseInt(passing_year.split('-')[0]);
        console.log('Extracted year from passing_year:', parsedPassingYear);
      } else {
        // Otherwise try to parse it as a number
        parsedPassingYear = parseInt(passing_year);
      }
      
      // If parsing failed, use current year as fallback
      if (isNaN(parsedPassingYear)) {
        console.warn('Invalid passing_year format:', passing_year);
        parsedPassingYear = new Date().getFullYear();
      }
    }
    
    const alumni = await Alumni.findOne({ email: req.user.email });
    
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    // Process education to ensure valid enum values
    let processedEducation = [];
    if (Array.isArray(education)) {
      processedEducation = education.map(edu => {
        // Ensure valid type enum
        let validType = edu.type;
        if (!['10th', '12th', 'Graduation', 'Post Graduation', ''].includes(validType)) {
          validType = ''; // Default to empty if invalid
        }
        
        return {
          ...edu,
          type: validType,
          institution: edu.institution || '',
          board: edu.board || '',
          year: edu.year ? parseInt(edu.year) : null,
          grade: edu.grade || '',
          percentage: edu.percentage ? parseFloat(edu.percentage) : 0
        };
      });
    }

    // Update fields
    alumni.first_name = first_name || alumni.first_name;
    alumni.middle_name = middle_name || alumni.middle_name;
    alumni.last_name = last_name || alumni.last_name;
    alumni.dob = parsedDob || alumni.dob;
    alumni.gender = gender || alumni.gender;
    alumni.phone = phone || alumni.phone;
    alumni.alt_phone = alt_phone || alumni.alt_phone;
    alumni.current_address = current_address || alumni.current_address;
    alumni.permanent_address = permanent_address || alumni.permanent_address;
    alumni.department = department || alumni.department;
    alumni.course = course || alumni.course;
    alumni.passing_year = parsedPassingYear || alumni.passing_year;
    alumni.current_company = current_company || alumni.current_company;
    alumni.designation = designation || alumni.designation;
    alumni.current_location = current_location || alumni.current_location;
    alumni.joined_date = parsedJoinedDate || alumni.joined_date;
    
    // Handle arrays carefully - make sure they're valid arrays
    if (Array.isArray(skillset)) {
      alumni.skillset = skillset;
    }

    if (Array.isArray(experience)) {
      alumni.experience = experience;
    }
    
    if (Array.isArray(projects)) {
      alumni.projects = projects;
    }
    
    if (Array.isArray(achievements)) {
      alumni.achievements = achievements;
    }
    
    alumni.education = processedEducation;
    
    if (profile) {
      alumni.profile = profile;
    }

    // If profileCompleted is explicitly set to true in the request, honor it
    if (profileCompleted === true) {
      alumni.profileCompleted = true;
    } else {
      // Otherwise validate based on required fields
      alumni.profileCompleted = alumni.validateProfileCompletion();
    }

    console.log('Saving alumni with profileCompleted:', alumni.profileCompleted);
    
    try {
      await alumni.save();
      
      // Return updated profile without password
      const updatedProfile = await Alumni.findOne({ email: req.user.email })
        .select('-password');

      res.json(updatedProfile);
    } catch (saveError) {
      console.error('Error saving alumni profile:', saveError);
      // If it's a validation error, provide detailed info
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message
        }));
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationErrors 
        });
      }
      throw saveError; // Re-throw for general error handler
    }
  } catch (error) {
    console.error('Error updating alumni profile:', error);
    // More detailed error response
    const errorResponse = {
      error: 'Failed to update profile',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    res.status(500).json(errorResponse);
  }
});

// Search alumni
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = {
      $or: [
        { first_name: { $regex: query, $options: 'i' } },
        { last_name: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } },
        { course: { $regex: query, $options: 'i' } },
        { skills: { $regex: query, $options: 'i' } }
      ]
    };

    const alumni = await Alumni.find(searchQuery)
      .select('-password')
      .limit(20);

    res.json(alumni);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all alumni profiles (public endpoint)
router.get('/all', async (req, res) => {
  try {
    const alumni = await Alumni.find()
      .select('-password -alt_phone -permanent_address -education')
      .sort({ passing_year: -1 });
    res.json(alumni);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Failed to fetch alumni data' });
  }
});

// Register new alumni
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    // Check if alumni already exists
    const existingAlumni = await Alumni.findOne({ email });
    if (existingAlumni) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new alumni with only email and password
    const alumni = new Alumni({
      email,
      password,
      profileCompleted: false,
      isApproved: false
    });

    await alumni.save();

    // Return success without password
    const { password: _, ...alumniWithoutPassword } = alumni.toObject();
    res.status(201).json({
      message: 'Registration successful',
      alumni: alumniWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Get all unique batch years
router.get('/batch-years', async (req, res) => {
  try {
    const years = await Alumni.distinct('passing_year');
    res.json(years.sort((a, b) => b - a));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch years' });
  }
});

module.exports = router; 