# Alumni Association Backend

This is the backend server for the Alumni Association application.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a .env file in the root directory with the following variables:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/alumni_association
JWT_SECRET=your-secret-key
NODE_ENV=development
```

3. Start MongoDB:
Make sure MongoDB is running on your system. The default connection string is `mongodb://localhost:27017/alumni_association`

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Alumni
- GET /api/alumni/profile - Get alumni profile
- PUT /api/alumni/profile - Update alumni profile
- GET /api/alumni/search - Search alumni

### Student
- GET /api/student/profile - Get student profile
- PUT /api/student/profile - Update student profile
- GET /api/student/all - Get all students (for alumni)

### Jobs
- POST /api/job - Post a new job (alumni only)
- GET /api/job - Get all jobs
- DELETE /api/job/:id - Delete a job (alumni only)
- GET /api/job/my-jobs - Get jobs posted by specific alumni

### Events
- POST /api/event - Create event (admin only)
- GET /api/event - Get all events
- PUT /api/event/:id - Update event (admin only)
- DELETE /api/event/:id - Delete event (admin only)

### Funds
- POST /api/fund - Create fund (admin only)
- GET /api/fund - Get all funds
- PUT /api/fund/:id - Update fund (admin only)
- DELETE /api/fund/:id - Delete fund (admin only)

### Feedback
- POST /api/feedback - Submit feedback
- GET /api/feedback - Get all feedback (admin only)
- DELETE /api/feedback/:id - Delete feedback (admin only)

## Authentication

All endpoints except registration and login require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Role-Based Access

- Alumni can access alumni-specific endpoints and post jobs
- Students can access student-specific endpoints
- Admin can access all endpoints and manage events, funds, and feedback 