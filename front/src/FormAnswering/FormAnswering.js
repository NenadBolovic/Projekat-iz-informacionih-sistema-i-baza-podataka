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
  const [isGuest, setIsGuest] = useState(false);

  // Base for serving images via API
  const formsApiBase = "http://localhost:3005/api/formsquestions";

  // Resolves various stored formats to a fetchable image URL:
  // - If absolute http(s) URL, return as is.
  // - If path contains "/images/<filename>", hit /api/formsquestions/images/<filename>
  // - Otherwise, prefix with /api/formsquestions and keep the path.
  const resolveQuestionImageSrc = (imgPath) => {
    if (!imgPath) return null;
    if (/^https?:\/\//i.test(imgPath)) return imgPath;

    // Try to extract filename from ".../images/<filename>"
    const match = imgPath.match(/(?:^|\/)images\/([^/?#]+)/i);
    if (match && match[1]) {
      return `${formsApiBase}/images/${encodeURIComponent(match[1])}`;
    }

    // Fallback: treat as API-relative path
    return `${formsApiBase}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsGuest(!token); // ako nema tokena, gost/anonimno

    const urlSegments = window.location.pathname.split("/");
    const formId = urlSegments[urlSegments.length - 1];

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`http://localhost:3005/api/formsquestions/forms/${formId}`, {
      headers,
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Access denied. This form may require sign-in.");
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
            formDataObj.questions.forEach((q) => {
              if (q.questionType === "multiple-choice-multiple") {
                initialAnswers[q._id] = [];
              }
              if (
                q.questionType === "numeric" &&
                q.numericAttributes?.min !== undefined
              ) {
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
      setAnswers((prev) => ({ ...prev, [questionId]: updatedValue }));
    } else if (questionType === "multiple-choice-multiple") {
      const currentSelections = [...(answers[questionId] || [])];

      if (value) {
        if (!currentSelections.includes(optionText)) {
          currentSelections.push(optionText);
        }
      } else {
        const index = currentSelections.indexOf(optionText);
        if (index > -1) {
          currentSelections.splice(index, 1);
        }
      }

      setAnswers((prev) => ({ ...prev, [questionId]: currentSelections }));
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmit = () => {
    if (!formData || !formData.questions) return;

    const token = localStorage.getItem("token");

    const formId = window.location.pathname.split("/").pop();
    const answersData = {
      formId,
      answers: formData.questions.map((q, index) => {
        let answerValue =
          answers[q._id] !== undefined ? answers[q._id] : "";

        if (
          q.questionType === "multiple-choice-multiple" &&
          Array.isArray(answerValue)
        ) {
          answerValue = answerValue.join(", ");
        }

        // Use stable questionId if available, otherwise fallback to array index
        const stableQuestionId =
          typeof q.questionId === "number" && !Number.isNaN(q.questionId)
            ? q.questionId
            : index;

        return {
          questionId: stableQuestionId,
          questionType: q.questionType,
          answer: answerValue,
        };
      }),
    };

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("answerData", JSON.stringify(answersData));

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch("http://localhost:3005/api/answers/answers", {
      method: "POST",
      body: formDataToSubmit,
      headers,
    })
      .then((res) => {
        if (!res.ok) {
          return res
            .json()
            .then((err) => {
              throw new Error(err.message || "Submission failed");
            });
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

  const renderNumericInput = (question) => {
    const min =
      question.numericAttributes?.min !== undefined
        ? question.numericAttributes.min
        : 0;
    const max =
      question.numericAttributes?.max !== undefined
        ? question.numericAttributes.max
        : 100;
    const step =
      question.numericAttributes?.step !== undefined
        ? question.numericAttributes.step
        : 1;

    const currentValue =
      answers[question._id] !== undefined ? answers[question._id] : min;

    return (
      <Paper
        elevation={0}
        sx={{ p: 2, bgcolor: "background.paper", borderRadius: "8px" }}
      >
        <Typography gutterBottom>
          Selected value: <strong>{currentValue}</strong>
        </Typography>
        <Box sx={{ px: 1, py: 2 }}>
          <Slider
            value={currentValue}
            onChange={(e, newValue) =>
              handleAnswerChange(
                question._id,
                newValue,
                question.questionType
              )
            }
            valueLabelDisplay="auto"
            step={step}
            marks
            min={min}
            max={max}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Min: {min}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max: {max}
          </Typography>
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

        {isGuest && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontStyle: "italic" }}
          >
            Odgovaraš kao gost (anonimno).
          </Typography>
        )}

        <div className="questions-section">
          {formData.questions.map((question) => {
            const imgSrc = resolveQuestionImageSrc(question.questionImage);
            return (
              <div key={question._id} className="question-form">
                <p>{question.questionText}</p>

                {/* Render question image if available, via API endpoint */}
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt="Slika pitanja"
                    loading="lazy"
                    style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, marginBottom: 8 }}
                    onError={(e) => {
                      // Fallback to direct API + original path if the images/<filename> route fails
                      const fallback = `${formsApiBase}${question.questionImage?.startsWith("/") ? "" : "/"}${question.questionImage || ""}`;
                      if (fallback && e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                )}

                {question.questionType === "short-text" && (
                  <TextField
                    fullWidth
                    placeholder="Type your answer..."
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        question._id,
                        e.target.value,
                        question.questionType
                      )
                    }
                  />
                )}

                {question.questionType === "long-text" && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Type your answer..."
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        question._id,
                        e.target.value,
                        question.questionType
                      )
                    }
                  />
                )}

                {question.questionType === "multiple-choice-single" && (
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[question._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(
                          question._id,
                          e.target.value,
                          question.questionType
                        )
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

                {question.questionType === "multiple-choice-multiple" && (
                  <FormControl component="fieldset" fullWidth>
                    <FormGroup>
                      {question.options.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          control={
                            <Checkbox
                              checked={
                                answers[question._id]?.includes(option.text) ||
                                false
                              }
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

                {question.questionType === "numeric" &&
                  renderNumericInput(question)}

                {question.questionType === "date" && (
                  <TextField
                    type="date"
                    fullWidth
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        question._id,
                        e.target.value,
                        question.questionType
                      )
                    }
                  />
                )}

                {question.questionType === "time" && (
                  <TextField
                    type="time"
                    fullWidth
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        question._id,
                        e.target.value,
                        question.questionType
                      )
                    }
                  />
                )}

                {question.required === 1 && (
                  <Typography variant="caption" color="error">
                    * Required
                  </Typography>
                )}
              </div>
            );
          })}
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