import React from "react";
import Home from "./HomePage/Home";
import Form1 from "./FormPage/Form";
import LogIn from "./LogInPage/LogIn";
import SignUp from "./LogInPage/SignUp";
import { UserProvider } from "./Usercontext/UserContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FormAnsweringPage from "./FormAnswering/FormAnswering";
import FormEditPage from "./FormEdit/FormEdit";
import MenageFormsPage from "./MenageForm/MenageForm";
import FormAnalytics from "./FormAnalytics/FormAnalytics";
import { Box } from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default"
          }}
        >
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, px: { xs: 1, sm: 2 }, py: 2 }}>
            <Routes>
              <Route path="/FormAnswering/:formId" element={<FormAnsweringPage />} />
              <Route path="/FormEdit/:formId" element={<FormEditPage />} />
              <Route path="/MenageForms" element={<MenageFormsPage />} />
              <Route path="/" element={<Home />} />
              <Route path="/form" element={<Form1 />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forms/analytics/:formId" element={<FormAnalytics />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;