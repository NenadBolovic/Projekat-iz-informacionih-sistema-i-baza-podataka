import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  FormControl,
  TextField,
  FormControlLabel,
  RadioGroup,
  Radio,
  // --- 1. Import Dialog components ---
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import "./form_answering.css";

function FormAnsweringPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  
  // --- 2. State to control the success dialog ---
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Access denied: No token provided. Please log in.");
      return;
    }

    const urlSegments = window.location.pathname.split("/");
    const formId = urlSegments[urlSegments.length - 1];

    fetch(`http://localhost:3005/api/formsquestions/forms/${formId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Access denied. Please log in again.");
        }
        return res.json();
      })
      .then((data) => {
        // This logic is from your working version
        if (data.form || data._id) {
            setFormData(data.form || data);
        } else {
            setError(data.message || "Failed to load form data.");
        }
      })
      .catch((error) => setError(error.message));
  }, []);

  const handleAnswerChange = (questionId, value, questionType) => {
    let updatedValue = value;
    if (questionType === "numeric") {
      updatedValue = value === "" ? null : Number(value);
      if (isNaN(updatedValue)) {
        updatedValue = null;
      }
    }
    setAnswers((prev) => ({
      ...prev,
      [questionId]: updatedValue,
    }));
  };

  const handleSubmit = () => {
    if (!formData || !formData.questions) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Access denied: No token provided. Please log in.");
      return;
    }

    const formId = window.location.pathname.split("/").pop();
    const answersData = {
      formId,
      answers: formData.questions.map((q, index) => ({
        questionId: index,
        questionType: q.questionType,
        answer: answers[q._id] !== undefined ? answers[q._id] : "",
      })),
    };

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("answerData", JSON.stringify(answersData));

    fetch("http://localhost:3005/api/answers/answers", {
      method: "POST",
      body: formDataToSubmit,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
           return res.json().then(err => { throw new Error(err.message || 'Submission failed') });
        }
        return res.json();
      })
      .then((data) => {
        if (data.success || data.answers) {
          // --- 3. Open the dialog on success ---
          setIsSuccessDialogOpen(true);
          setError("");
        } else {
          setError(data.message || "Submission failed.");
        }
      })
      .catch((err) => setError(err.message));
    };
    
  // --- 4. Function to close dialog and navigate ---
  const handleCloseSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    navigate("/");
  };


  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!formData) return <p>Loading form...</p>;
  
  // The old success message block is removed.
  
  return (
    // --- 5. Wrap in a Fragment to hold the form and the dialog ---
    <>
      <div className="form-container">
        <h2>{formData.name}</h2>
        <p>{formData.description}</p>
        <div className="questions-section">
          {formData.questions.map((question) => (
            <div key={question._id} className="question-form">
              <p>{question.questionText}</p>
              {question.questionType === "short-text" && (
                <TextField
                  fullWidth
                  placeholder="Type your answer..."
                  value={answers[question._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value, question.questionType)
                  }
                />
              )}
              {question.questionType === "multiple-choice-single" && (
                <FormControl component="fieldset">
                  <RadioGroup
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value, question.questionType)
                    }
                  >
                    {question.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option.text}
                        control={<Radio />}
                        label={option.text}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              {question.questionType === "numeric" && (
                <TextField
                  type="number"
                  inputProps={{
                    min: question.numericAttributes?.min || 0,
                    max: question.numericAttributes?.max || 100,
                    step: question.numericAttributes?.step || 1,
                  }}
                  value={
                    answers[question._id] !== undefined ? answers[question._id] : ""
                  }
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value, question.questionType)
                  }
                />
              )}
            </div>
          ))}
        </div>
        <Button variant="contained" color="success" onClick={handleSubmit}>
          Submit
        </Button>
      </div>

      {/* --- 6. The Success Dialog --- */}
      <Dialog
        open={isSuccessDialogOpen}
        onClose={handleCloseSuccessDialog}
        aria-labelledby="success-dialog-title"
      >
        <DialogTitle id="success-dialog-title">
          {"Submission Successful"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Thank you! Your answers have been submitted successfully.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary" autoFocus>
            Return to Home
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default FormAnsweringPage;