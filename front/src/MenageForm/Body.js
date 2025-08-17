import React, { useEffect, useState } from "react";
import FormCard from "./FormCard.js";
import { useUser } from "../Usercontext/UserContext";
import "./body.css";

const Body = () => {
  const { username } = useUser(); // Get username from context
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        let url = "http://localhost:3005/api/formsquestions/forms/forGuest"; // Default URL
        let options = {}; // Initialize options

        if (username) {
          url = "http://localhost:3005/api/formsquestions/forms/related";
          const token = localStorage.getItem("token");

          if (!token) {
            console.error("No token found. User may not be authenticated.");
            return;
          }

          options = {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Attach token in Authorization header
            },
          };
        }

        // Fetch with appropriate URL & options
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setForms(data.forms || []); // Store the fetched forms
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };

    fetchForms();
  }, [username]); // Re-fetch when username changes

  return (
    <div className="body-container">
      {forms.length > 0 ? (
        forms.map((form) => <FormCard key={form._id} form={form} />)
      ) : (
        <p>No forms available.</p>
      )}
    </div>
  );
};

export default Body;
