import React, { useState } from "react";
import "./login.css";

function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
  
    // Prepare the payload with the correct field names
    const payload = {
      firstname: formData.firstName, // Ensure these match backend expectations
      lastname: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };
  
    // Log the payload to ensure all fields are present
    
  
    try {
      const response = await fetch("http://localhost:3005/api/authentication/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.log("Backend error:", data);  // Log backend error message
        throw new Error(data.message || "Something went wrong!");
      }
  
      setSuccess("Registration successful! You can now log in.");
    } catch (error) {
      setError(error.message);
    }
  };
  


  return (
    <div className="login-box">
      <p>Sign Up</p>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="user-box">
          <input
            required
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
          />
          <label>First Name</label>
        </div>
        <div className="user-box">
          <input
            required
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
          />
          <label>Last Name</label>
        </div>
        <div className="user-box">
          <input
            required
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
          />
          <label>Username</label>
        </div>
        <div className="user-box">
          <input
            required
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <label>Email</label>
        </div>
        <div className="user-box">
          <input
            required
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          <label>Password</label>
        </div>
        <button type="submit" className="submit-button">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          Sign Up
        </button>
      </form>
      <p>
        Already have an account? <a href="Login" className="a2">Log in!</a>
      </p>
    </div>
  );
}

export default SignUp;
