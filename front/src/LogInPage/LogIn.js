import React, { useState, useEffect } from "react";
import axios from "axios";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../Usercontext/UserContext";

function LogIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { setUsername } = useUser();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        setUsername(decodedToken.username);
        if (decodedToken.userId) {
          localStorage.setItem("userId", decodedToken.id);
        }
      } catch (error) {
        console.error("Invalid token on initial load:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    }
  }, [setUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await axios.post(
        "http://localhost:3005/api/authentication/login",
        {
          username: formData.username,
          password: formData.password,
        }
      );
      if (response.status === 200) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const decodedToken = jwtDecode(token);
        setUsername(decodedToken.username);
        if (decodedToken.id) {
          localStorage.setItem("userId", decodedToken.id);
        }
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 400)
      ) {
        setErrorMessage("Invalid username or password. Please try again.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again later.");
      }
    }
  };

  return (
    <div className="auth-center">
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
            <span />
            <span />
            <span />
            <span />
            Submit
          </button>
        </form>
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <p className="switch-link">
          Don't have an account?{" "}
          <a href="/SignUp" className="a2">
            Sign up!
          </a>
        </p>
      </div>
    </div>
  );
}

export default LogIn;