import React from "react";
import Home from "./HomePage/Home"
import Form1 from "../src/FormPage/Form"
import LogIn from "./LogInPage/LogIn";
import SignUp from "./LogInPage/SignUp"
import { UserProvider } from "./Usercontext/UserContext";
/*komponenta za mapianje stranica i ruta*/
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import FormAnsweringPage from "./FormAnswering/FormAnswering";
import FormEditPage from "./FormEdit/FormEdit";
import MenageFormsPage from "./MenageForm/MenageForm";
import FormAnalytics from "./FormAnalytics/FormAnalytics";


function App() {
    return (
        <BrowserRouter>
            <UserProvider>
            <Navbar />
            <Routes>
                <Route path="/FormAnswering/:formId" element={<FormAnsweringPage />} />
                <Route path="/FormEdit/:formId" element={<FormEditPage />} />
                <Route path="/MenageForms" element={<MenageFormsPage />} />
                <Route path="/" element={<Home />} />
                <Route path="/form" element={<Form1 />} />
                <Route path="/login" element={<LogIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forms/analytics/:formId" element={<FormAnalytics />}/>
            </Routes>
            </UserProvider>
        </BrowserRouter>
    );
}



/*

function App() {
    return (
        <Home/>
    )
}
*/
export default App;
