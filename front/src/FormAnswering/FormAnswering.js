import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  FormControl,
  TextField,
  FormControlLabel,
  RadioGroup,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormGroup,
  Box,
  Typography,
  Slider,
  Paper,
} from "@mui/material";
import "./form_answering.css";

function FormAnsweringPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
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
        if (data.form || data._id) {
            const formDataObj = data.form || data;
            setFormData(formDataObj);
            
            // Initialize answers
            const initialAnswers = {};
            if (formDataObj.questions) {
              formDataObj.questions.forEach(q => {
                if (q.questionType === "multiple-choice-multiple") {
                  initialAnswers[q._id] = [];
                }
                // Initialize numeric values to their minimum value
                if (q.questionType === "numeric" && q.numericAttributes?.min !== undefined) {
                  initialAnswers[q._id] = q.numericAttributes.min;
                }
              });
              
              setAnswers(initialAnswers);
            }
        } else {
            setError(data.message || "Failed to load form data.");
        }
      })
      .catch((error) => setError(error.message));
  }, []);

  const handleAnswerChange = (questionId, value, questionType, optionText) => {
    let updatedValue = value;
    
    if (questionType === "numeric") {
      updatedValue = value === "" ? 0 : Number(value);
      if (isNaN(updatedValue)) {
        updatedValue = 0;
      }
      setAnswers(prev => ({...prev, [questionId]: updatedValue}));
    } 
    else if (questionType === "multiple-choice-multiple") {
      // Handle checkbox selections (add/remove from array)
      const currentSelections = [...(answers[questionId] || [])];
      
      if (value) { // checkbox checked
        if (!currentSelections.includes(optionText)) {
          currentSelections.push(optionText);
        }
      } else { // checkbox unchecked
        const index = currentSelections.indexOf(optionText);
        if (index > -1) {
          currentSelections.splice(index, 1);
        }
      }
      
      setAnswers(prev => ({...prev, [questionId]: currentSelections}));
    }
    else {
      // For all other types (text, date, time, radio buttons)
      setAnswers(prev => ({...prev, [questionId]: value}));
    }
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
      answers: formData.questions.map((q, index) => {
        // Format the answer based on question type
        let answerValue = answers[q._id] !== undefined ? answers[q._id] : "";
        
        // For multiple-choice-multiple, join array to string
        if (q.questionType === "multiple-choice-multiple" && Array.isArray(answerValue)) {
          answerValue = answerValue.join(", ");
        }
        
        return {
          questionId: index,
          questionType: q.questionType,
          answer: answerValue
        };
      }),
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
          setIsSuccessDialogOpen(true);
          setError("");
        } else {
          setError(data.message || "Submission failed.");
        }
      })
      .catch((err) => setError(err.message));
  };
    
  const handleCloseSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    navigate("/");
  };

  // Simplified numeric input with just a slider
  const renderNumericInput = (question) => {
    const min = question.numericAttributes?.min !== undefined ? question.numericAttributes.min : 0;
    const max = question.numericAttributes?.max !== undefined ? question.numericAttributes.max : 100;
    const step = question.numericAttributes?.step !== undefined ? question.numericAttributes.step : 1;
    
    // Ensure there's always a value for the slider
    const currentValue = answers[question._id] !== undefined ? answers[question._id] : min;
    
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '8px' }}>
        <Typography gutterBottom>
          Selected value: <strong>{currentValue}</strong>
        </Typography>
        <Box sx={{ px: 1, py: 2 }}>
          <Slider
            value={currentValue}
            onChange={(e, newValue) => 
              handleAnswerChange(question._id, newValue, question.questionType)
            }
            valueLabelDisplay="auto"
            step={step}
            marks
            min={min}
            max={max}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Min: {min}</Typography>
          <Typography variant="caption" color="text.secondary">Max: {max}</Typography>
        </Box>
      </Paper>
    );
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!formData) return <p>Loading form...</p>;
  
  return (
    <>
      <div className="form-container">
        <h2>{formData.name}</h2>
        <p>{formData.description}</p>
        <div className="questions-section">
          {formData.questions.map((question) => (
            <div key={question._id} className="question-form">
              <p>{question.questionText}</p>
              
              {/* Short text input */}
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
              
              {/* Long text input - multiline */}
              {question.questionType === "long-text" && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Type your answer..."
                  value={answers[question._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value, question.questionType)
                  }
                />
              )}
              
              {/* Single choice radio buttons */}
              {question.questionType === "multiple-choice-single" && (
                <FormControl component="fieldset" fullWidth>
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
              
              {/* Multiple choice checkboxes */}
              {question.questionType === "multiple-choice-multiple" && (
                <FormControl component="fieldset" fullWidth>
                  <FormGroup>
                    {question.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        control={
                          <Checkbox
                            checked={answers[question._id]?.includes(option.text) || false}
                            onChange={(e) =>
                              handleAnswerChange(
                                question._id,
                                e.target.checked,
                                question.questionType,
                                option.text
                              )
                            }
                          />
                        }
                        label={option.text}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              )}
              
              {/* Simplified numeric input with just slider */}
              {question.questionType === "numeric" && renderNumericInput(question)}
              
              {/* Date input */}
              {question.questionType === "date" && (
                <TextField
                  type="date"
                  fullWidth
                  value={answers[question._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value, question.questionType)
                  }
                />
              )}
              
              {/* Time input */}
              {question.questionType === "time" && (
                <TextField
                  type="time"
                  fullWidth
                  value={answers[question._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value, question.questionType)
                  }
                />
              )}
              
              {/* If the question is required, show a visual indicator */}
              {question.required === 1 && (
                <Typography variant="caption" color="error">* Required</Typography>
              )}
            </div>
          ))}
        </div>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSubmit}
          sx={{ mt: 2 }}
        >
          Submit
        </Button>
      </div>

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