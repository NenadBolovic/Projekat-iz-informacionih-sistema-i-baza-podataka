import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FormBody from "./FormBody"; // Your existing form builder
import { isAuthenticated } from "../auth/authUtils.js"; // Adjust path if needed

function Form() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      // If not logged in, redirect to login and remember this page's path.
      navigate("/login", { replace: true, state: { from: location.pathname } });
    } else {
      // If logged in, allow rendering.
      setIsAuthorized(true);
    }
  }, [navigate, location]);

  // Don't render the form until authorization is confirmed.
  if (!isAuthorized) {
    return <div style={{ padding: "2rem" }}>Authorizing...</div>;
  }

  return <FormBody />;
}

export default Form;