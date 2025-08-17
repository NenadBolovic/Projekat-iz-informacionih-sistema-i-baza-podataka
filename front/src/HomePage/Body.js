import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormCard from "./FormCard.js";
import { useUser } from "../Usercontext/UserContext";
import "./body.css";

const Body = () => {
  const { username } = useUser();
  const [forms, setForms] = useState([]);
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const fetchForms = async () => {
      try {
        let url = "";
        let options = {};
        const token = localStorage.getItem("token");

        if (searchQuery) {
          url = `http://localhost:3005/api/formsquestions/forms/search?q=${searchQuery}`;
          if (token) {
            options = {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };
          }
        } else {
          if (username && token) {
            url = "http://localhost:3005/api/formsquestions/forms/related";
            options = {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };
          } else {
            url = "http://localhost:3005/api/formsquestions/forms/forGuest";
          }
        }

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setForms(data.forms || data || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        setForms([]);
      }
    };

    fetchForms();
  }, [username, searchQuery]);

  return (
    <div className="body-container">
      {forms.length > 0 ? (
        forms.map((form) => <FormCard key={form._id} form={form} />)
      ) : (
        <p>
          {searchQuery
            ? "No forms found matching your search."
            : "No forms available."}
        </p>
      )}
    </div>
  );
};

export default Body;