import React, { useState } from "react";
import {
  Button,
  FormControl,
  Select,
  TextField,
  MenuItem,
  Switch,
  FormGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import "./form_body.css";
import { useNavigate } from "react-router-dom";

function FormBody() {
  const navigate = useNavigate();
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [questions, setQuestions] = useState([]);

  // Collaborator & Observer states
  const [collaboratorsUsernames, setCollaboratorsUsernames] = useState([]);
  const [observersUsernames, setObserversUsernames] = useState([]);
  const [collabDialogOpen, setCollabDialogOpen] = useState(false);
  const [observerDialogOpen, setObserverDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: "",
        type: "short-text", // Default to a type
        isRequired: false,
        image: null,
        options: [],
        settings: {},
      },
    ]);
  };

  const handleUpdateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleCloneQuestion = (id) => {
    const questionToClone = questions.find((q) => q.id === id);
    if (questionToClone) {
        const index = questions.findIndex(q => q.id === id);
        const newQuestion = { ...questionToClone, id: Date.now() };
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        setQuestions(newQuestions);
    }
  };

  const handleMoveQuestion = (id, direction) => {
    const index = questions.findIndex((q) => q.id === id);
    if (index < 0) return;

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(index, 1);
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex <= newQuestions.length) {
      newQuestions.splice(newIndex, 0, removed);
      setQuestions(newQuestions);
    }
  };

  const renderAnswerTypeSettings = (question) => {
    switch (question.type) {
      case "single-choice":
      case "multiple-choice":
        return (
          <div>
            {(question.options || []).map((option, index) => (
              <Box key={index} display="flex" alignItems="center" mb={1}>
                <TextField
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options];
                    newOptions[index] = e.target.value;
                    handleUpdateQuestion(question.id, "options", newOptions);
                  }}
                  placeholder={`Option ${index + 1}`}
                  fullWidth
                />
                <IconButton
                  onClick={() => {
                    const newOptions = question.options.filter((_, i) => i !== index);
                    handleUpdateQuestion(question.id, "options", newOptions);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              onClick={() =>
                handleUpdateQuestion(question.id, "options", [
                  ...(question.options || []),
                  "",
                ])
              }
            >
              Add Option
            </Button>
          </div>
        );
      case "numeric":
        return (
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Min Value"
              type="number"
              value={question.settings?.min || ""}
              onChange={(e) =>
                handleUpdateQuestion(question.id, "settings", {
                  ...question.settings,
                  min: e.target.value,
                })
              }
            />
            <TextField
              label="Max Value"
              type="number"
              value={question.settings?.max || ""}
              onChange={(e) =>
                handleUpdateQuestion(question.id, "settings", {
                  ...question.settings,
                  max: e.target.value,
                })
              }
            />
            <TextField
              label="Step"
              type="number"
              value={question.settings?.step || ""}
              onChange={(e) =>
                handleUpdateQuestion(question.id, "settings", {
                  ...question.settings,
                  step: e.target.value,
                })
              }
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const fetchIds = async (usernames = []) => {
    if (!usernames.length) return [];
    const token = localStorage.getItem("token");
    const ids = [];
    for (const username of usernames) {
      try {
        const res = await fetch(`http://localhost:3005/api/users/users/search/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.users.length > 0) {
          ids.push(data.users[0].userId);
        }
      } catch (err) {
        console.error(`Error resolving userId for ${username}:`, err);
      }
    }
    return ids;
  };

  const handleAddUsername = (list, setList) => {
    if (currentUsername.trim() && !list.includes(currentUsername.trim())) {
      setList([...list, currentUsername.trim()]);
    }
    setCurrentUsername("");
  };

  const handleRemoveUsername = (username, list, setList) => {
    setList(list.filter(u => u !== username));
  };
  
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to create a form.");
        return;
    }

    const finalCollaboratorsIds = await fetchIds(collaboratorsUsernames);
    const finalObserversIds = await fetchIds(observersUsernames);

    const formDataObj = {
      name: formName || "Untitled Form",
      description: formDescription,
      indicator: allowAnonymous,
      locked: 0,
      collaborators: finalCollaboratorsIds,
      observers: finalObserversIds,
      questions: questions.map((q) => {
        // Map each UI question type to the correct database question type
        let questionType;
        switch(q.type) {
          case "short-text": 
            questionType = "short-text"; 
            break;
          case "long-text": 
            questionType = "long-text"; 
            break;
          case "single-choice": 
            questionType = "multiple-choice-single"; 
            break;
          case "multiple-choice": 
            questionType = "multiple-choice-multiple"; 
            break;
          case "numeric": 
            questionType = "numeric"; 
            break;
          case "date": 
            questionType = "date"; 
            break;
          case "time": 
            questionType = "time"; 
            break;
          default: 
            questionType = q.type; // Fallback to the original type
        }
        
        const questionObj = {
          questionText: q.text,
          questionType: questionType,
          required: q.isRequired ? 1 : 0,
          options: q.options?.filter(opt => opt.trim() !== "").map(opt => ({ text: opt })) || [],
        };
        
        if (q.type === "numeric") {
          questionObj.numericAttributes = {
            min: q.settings?.min ? parseFloat(q.settings.min) : null,
            max: q.settings?.max ? parseFloat(q.settings.max) : null,
            step: q.settings?.step ? parseFloat(q.settings.step) : 1,
          };
        }
        
        if (q.image) questionObj.questionImage = q.image;
        return questionObj;
      }),
    };

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("formData", JSON.stringify(formDataObj));

    try {
        const res = await fetch("http://localhost:3005/api/formsquestions/forms", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataToSubmit,
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Failed to submit form");
        }
        alert("Form created successfully!");
        navigate("/");
    } catch (err) {
        console.error("Error submitting form:", err);
        alert(`Error: ${err.message}`);
    }
};

  return (
    <div className="form-container" style={{ maxWidth: 900, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>Create a New Form</Typography>
      
      <TextField
        label="Form Name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        placeholder="Untitled Form"
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Form Description"
        value={formDescription}
        onChange={(e) => setFormDescription(e.target.value)}
        placeholder="Add a description"
        fullWidth
        multiline
        sx={{ mb: 2 }}
      />
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Switch checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} />}
          label={allowAnonymous ? "Enable anonymous submissions" : "Disable anonymous submissions"}
        />
      </FormGroup>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={() => setCollabDialogOpen(true)}>Manage Collaborators</Button>
        <Button variant="outlined" onClick={() => setObserverDialogOpen(true)}>Manage Observers</Button>
      </Box>
      <Box sx={{ mb: 2 }}>
          {collaboratorsUsernames.length > 0 && <Typography variant="subtitle2">Collaborators:</Typography>}
          {collaboratorsUsernames.map(u => <Chip key={u} label={u} onDelete={() => handleRemoveUsername(u, collaboratorsUsernames, setCollaboratorsUsernames)} sx={{ mr: 1 }} />)}
      </Box>
       <Box sx={{ mb: 2 }}>
          {observersUsernames.length > 0 && <Typography variant="subtitle2">Observers:</Typography>}
          {observersUsernames.map(u => <Chip key={u} label={u} onDelete={() => handleRemoveUsername(u, observersUsernames, setObserversUsernames)} sx={{ mr: 1 }} />)}
      </Box>

      <div className="questions-section">
        {questions.map((question, index) => (
          <div key={question.id} className="question-form">
            <TextField
              label={`Question ${index + 1}`}
              value={question.text}
              onChange={(e) => handleUpdateQuestion(question.id, "text", e.target.value)}
              placeholder="Enter question text"
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={question.type}
                onChange={(e) => handleUpdateQuestion(question.id, "type", e.target.value)}
              >
                <MenuItem value="short-text">Short Text</MenuItem>
                <MenuItem value="long-text">Long Text</MenuItem>
                <MenuItem value="single-choice">Single Choice</MenuItem>
                <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                <MenuItem value="numeric">Numeric</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="time">Time</MenuItem>
              </Select>
            </FormControl>

            {/* Image Upload - Simplified */}
            <Button variant="outlined" component="label" size="small">
              Upload Image
              <input type="file" hidden accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => handleUpdateQuestion(question.id, "image", reader.result);
                  reader.readAsDataURL(file);
              }}/>
            </Button>
            {question.image && <img src={question.image} alt="Preview" style={{ maxHeight: 100, marginTop: 10, borderRadius: 4 }}/>}

            {renderAnswerTypeSettings(question)}

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} borderTop={1} borderColor="grey.300" pt={1}>
                <FormControlLabel control={<Switch checked={question.isRequired} onChange={(e) => handleUpdateQuestion(question.id, "isRequired", e.target.checked)}/>} label="Required"/>
                <div>
                    <IconButton title="Clone" onClick={() => handleCloneQuestion(question.id)}><ContentCopyIcon /></IconButton>
                    <IconButton title="Move Up" disabled={index === 0} onClick={() => handleMoveQuestion(question.id, "up")}><ArrowUpwardIcon /></IconButton>
                    <IconButton title="Move Down" disabled={index === questions.length - 1} onClick={() => handleMoveQuestion(question.id, "down")}><ArrowDownwardIcon /></IconButton>
                    <IconButton title="Delete" color="error" onClick={() => handleDeleteQuestion(question.id)}><DeleteIcon /></IconButton>
                </div>
            </Box>
          </div>
        ))}
      </div>

      <Button variant="contained" color="primary" onClick={handleAddQuestion} sx={{ mt: 2 }}>Add Question</Button>
      <Button variant="contained" color="success" onClick={handleSubmit} sx={{ mt: 2, ml: 2 }}>Create Form</Button>

      {/* Dialogs */}
      <Dialog open={collabDialogOpen} onClose={() => setCollabDialogOpen(false)}>
        <DialogTitle>Manage Collaborators</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1}>
            <TextField label="Username" value={currentUsername} onChange={e => setCurrentUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddUsername(collaboratorsUsernames, setCollaboratorsUsernames)} />
            <Button onClick={() => handleAddUsername(collaboratorsUsernames, setCollaboratorsUsernames)}>Add</Button>
          </Box>
          <Box mt={2}>
            {collaboratorsUsernames.map(u => <Chip key={u} label={u} onDelete={() => handleRemoveUsername(u, collaboratorsUsernames, setCollaboratorsUsernames)} />)}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setCollabDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>
      <Dialog open={observerDialogOpen} onClose={() => setObserverDialogOpen(false)}>
        <DialogTitle>Manage Observers</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1}>
            <TextField label="Username" value={currentUsername} onChange={e => setCurrentUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddUsername(observersUsernames, setObserversUsernames)} />
            <Button onClick={() => handleAddUsername(observersUsernames, setObserversUsernames)}>Add</Button>
          </Box>
          <Box mt={2}>
            {observersUsernames.map(u => <Chip key={u} label={u} onDelete={() => handleRemoveUsername(u, observersUsernames, setObserversUsernames)} />)}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setObserverDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </div>
  );
}

export default FormBody;