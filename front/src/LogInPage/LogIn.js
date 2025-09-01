import React, { useState, useEffect } from "react";
import axios from "axios";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../Usercontext/UserContext";

function LogIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { setUsername } = useUser();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        setUsername(decodedToken.username);
        // --- ADDED: Also store userId if token exists but userId is not in localStorage ---
        if (decodedToken.userId ) {
          localStorage.setItem("userId", decodedToken.id);
        }
      } catch (error) {
        console.error("Invalid token on initial load:", error);
        // Optional: Clear invalid token if found
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    }
  }, [setUsername]); // Added setUsername to dependency array for correctness

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await axios.post("http://localhost:3005/api/authentication/login", {
        username: formData.username,
        password: formData.password,
      });

      if (response.status === 200) {
        const token = response.data.token;
        localStorage.setItem("token", token);

        // Decode the token to get user info
        const decodedToken = jwtDecode(token);

        // Set username in context
        setUsername(decodedToken.username);

        // --- THIS IS THE KEY CHANGE ---
        // Check if the user ID exists in the token and store it in localStorage.
        // Assumes the ID field in your JWT payload is named 'id'.
        if (decodedToken.id) {
          localStorage.setItem("userId", decodedToken.id);
          console.log(`User ID ${decodedToken.id} stored in localStorage.`);
        } else {
          console.warn("User ID ('id') not found in the JWT payload.");
        }

        navigate("/"); // Navigate to home
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        setErrorMessage("Invalid username or password. Please try again.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again later.");
      }
    }
  };

  // getUsernameFromToken is not used in the component's render logic, so it can be removed
  // If you need it elsewhere, you can keep it.
  
  return (
    <div className="login-box">
      <p>Login</p>
      <form onSubmit={handleSubmit}>
        <div className="user-box">
          <input
            required
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
          />
          <label>Email or username</label>
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
          Submit
        </button>
      </form>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <p>
        Don't have an account? <a href="/SignUp" className="a2">Sign up!</a>
      </p>
    </div>
  );
}

export default LogIn;