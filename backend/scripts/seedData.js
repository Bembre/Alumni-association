const mongoose = require('mongoose');
const Student = require('../models/Student');
const Alumni = require('../models/Alumni');
const Admin = require('../models/Admin');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/alumni_association', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Student.deleteMany({});
    await Alumni.deleteMany({});
    console.log('Cleared existing data');

    // Create test students
    const students = [
      {
        email: 'john.doe.cs2023@mgmcen.ac.in',
        password: 'password123',
        department: 'Computer Science',
        course: 'B.Tech',
        first_name: 'John',
        last_name: 'Doe',
        dob: new Date('2000-01-01'),
        gender: 'Male',
        current_year: '3rd Year',
        phone: '1234567890',
        student_id: 'STU-2023-12345',
        current_address: '123 Main St',
        permanent_address: '123 Main St',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: [{
          type: 'Internship',
          company: 'Tech Corp',
          position: 'Frontend Developer',
          duration: '3 months',
          description: 'Worked on React applications'
        }],
        education: [{
          type: '10th',
          institution: 'High School',
          board: 'CBSE',
          year: 2018,
          grade: 'A',
          percentage: 85
        }],
        mentorship_status: 'Available',
        profileCompleted: true
      },
      {
        email: 'jane.smith.cs2023@mgmcen.ac.in',
        password: 'password123',
        department: 'Computer Science',
        course: 'B.Tech',
        first_name: 'Jane',
        last_name: 'Smith',
        dob: new Date('2000-02-02'),
        gender: 'Female',
        current_year: '3rd Year',
        phone: '2345678901',
        student_id: 'STU-2023-12346',
        current_address: '456 Oak St',
        permanent_address: '456 Oak St',
        skills: ['Python', 'Django', 'Machine Learning'],
        experience: [{
          type: 'Internship',
          company: 'AI Solutions',
          position: 'ML Intern',
          duration: '2 months',
          description: 'Worked on machine learning models'
        }],
        education: [{
          type: '10th',
          institution: 'High School',
          board: 'CBSE',
          year: 2018,
          grade: 'A+',
          percentage: 90
        }],
        mentorship_status: 'Available',
        profileCompleted: true
      },
      {
        email: 'alex.wilson.cs2023@mgmcen.ac.in',
        password: 'password123',
        department: 'Computer Science',
        course: 'B.Tech',
        first_name: 'Alex',
        last_name: 'Wilson',
        dob: new Date('2000-03-03'),
        gender: 'Male',
        current_year: '3rd Year',
        phone: '3456789012',
        student_id: 'STU-2023-12347',
        current_address: '789 Pine St',
        permanent_address: '789 Pine St',
        skills: ['Java', 'Spring Boot', 'AWS'],
        experience: [{
          type: 'Internship',
          company: 'Cloud Solutions',
          position: 'Backend Developer',
          duration: '4 months',
          description: 'Worked on Spring Boot applications'
        }],
        education: [{
          type: '10th',
          institution: 'High School',
          board: 'CBSE',
          year: 2018,
          grade: 'A',
          percentage: 88
        }],
        mentorship_status: 'Available',
        profileCompleted: true
      }
    ];

    // Create test alumni
    const alumni = [
      {
        email: 'mike.johnson@techcorp.com',
        password: 'password123',
        first_name: 'Mike',
        last_name: 'Johnson',
        dob: new Date('1995-01-01'),
        gender: 'Male',
        phone: '3456789012',
        current_address: '789 Pine St',
        permanent_address: '789 Pine St',
        department: 'Computer Science',
        course: 'B.Tech',
        graduation_year: 2018,
        current_company: 'Tech Corp',
        designation: 'Senior Developer',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        mentorship_status: 'Available',
        max_students: 3,
        profileCompleted: true
      },
      {
        email: 'sarah.chen@innovatech.com',
        password: 'password123',
        first_name: 'Sarah',
        last_name: 'Chen',
        dob: new Date('1994-05-15'),
        gender: 'Female',
        phone: '4567890123',
        current_address: '321 Tech Park',
        permanent_address: '321 Tech Park',
        department: 'Computer Science',
        course: 'B.Tech',
        graduation_year: 2017,
        current_company: 'InnovaTech',
        designation: 'Tech Lead',
        skills: ['Python', 'Django', 'Machine Learning', 'AWS'],
        mentorship_status: 'Available',
        max_students: 3,
        profileCompleted: true
      }
    ];

    // Insert data
    await Student.insertMany(students);
    await Alumni.insertMany(alumni);
    console.log('Test data inserted successfully');

    // Seed admin user
    const adminData = {
      username: 'admin',
      email: 'admin@alumni.com',
      password: '123456',
      profile: ''
    };
    // Remove existing admin with same email or username
    await Admin.deleteMany({ $or: [ { email: adminData.email }, { username: adminData.username } ] });
    await Admin.create(adminData);
    console.log('Admin user seeded: admin@alumni.com / 123456');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 