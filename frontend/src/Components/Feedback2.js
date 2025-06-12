import React from 'react'

export default function Feedback() {
  return (
    <div class="container mt-5" style={{maxWidth: "1200px"}}>
  <h3 class="mb-4 text-center">Feedback Form</h3>
  <form>
    <div class="mb-3">
      <label for="name" class="form-label">Your Name</label>
      <input type="text" class="form-control" id="name" placeholder="Enter your name" required/>
    </div>
    
    <div class="mb-3">
      <label for="email" class="form-label">Email address</label>
      <input type="email" class="form-control" id="email" placeholder="name@example.com" required/>
    </div>

    <div class="mb-3">
      <label for="message" class="form-label">Your Feedback</label>
      <textarea class="form-control" id="message" rows="4" placeholder="Enter your feedback here..." required/>
    </div>

    <button type="submit" class="btn btn-primary w-100">Submit Feedback</button>
  </form>
</div>
  )
}
