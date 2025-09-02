// Full and complete code for EditFormPage.jsx
// Last updated: 2025-08-11 08:54:35 UTC
// User: NenadBolovic

import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  Switch,
  FormGroup,
  FormControlLabel,
  FormControl,
  IconButton,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PeopleIcon from '@mui/icons-material/People';
import { useParams, useNavigate } from "react-router-dom";

const getCurrentUserId = () => {
  try {
    // Attempt to get 'userId' from localStorage.
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null; // Assuming the ID is a number
  } catch (e) {
    console.error("Could not get user ID from localStorage", e);
    return null;
  }
};

function EditFormPage() {
  const { formId } = useParams();
  const navigate = useNavigate();

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [observers, setObservers] = useState([]);
  const [creatorId, setCreatorId] = useState(null);
  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const apiBase = "http://localhost:3005/api/formsquestions";

  const isCreator = creatorId != null && (Number(creatorId) === getCurrentUserId());

  useEffect(() => {
    if (!loading) { // Only log after the data has been fetched
      console.log("🕵️‍♂️ Creator Check:", {
        creatorIdFromApi: creatorId,
        loggedInUserId: getCurrentUserId(),
        isCreator: isCreator,
      });
    }
  }, [creatorId, loading, isCreator]);


  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Access Denied. Please log in.");
      navigate("/login");
    }
    return token;
  };

  // Load form and questions
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${apiBase}/forms/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch form: ${txt}`);
        }
        const { form } = await res.json();
        setFormName(form.name || "");
        setFormDescription(form.description || "");
        setAllowAnonymous(!!form.indicator);
        setIsLocked(!!form.locked);
        setCollaborators(form.collaborators || []);
        setObservers(form.observers || []);
        setCreatorId(form.authId);
        const loadedQuestions = (form.questions || []).map((q) => ({
          ...q,
          tempId: q._id || `${Date.now()}-${Math.random()}`,
        }));
        setQuestions(loadedQuestions);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [formId, navigate]);

  // Local-only edits
  const handleUpdateQuestionLocal = (tempId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q))
    );
  };

  const handleAddQuestionLocal = () => {
    setQuestions((prev) => [
      ...prev,
      {
        tempId: `${Date.now()}-${Math.random()}`,
        questionText: "New Question",
        questionType: "short-text",
        required: 0,
        options: [],
      },
    ]);
  };

  const handleRemoveNewQuestionLocal = (tempId) => {
    setQuestions((prev) => prev.filter((x) => x.tempId !== tempId || x._id));
  };

  const handleMoveQuestion = (index, direction) => {
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(index + (direction === "up" ? -1 : 1), 0, moved);
      return next;
    });
  };

  // Helpers
  const sanitizeForCreate = (q) => {
    const { tempId, _id, __v, ...rest } = q || {};
    return {
      questionText: rest.questionText ?? "",
      questionType: rest.questionType ?? "short-text",
      required: rest.required ? 1 : 0,
      options: Array.isArray(rest.options) ? rest.options : [],
      ...(rest.questionImage ? { questionImage: rest.questionImage } : {}),
    };
  };

  const sanitizeForUpdate = (q) => {
    const { tempId, _id, __v, formId: _ignore, ...rest } = q || {};
    const updateData = {};
    if (rest.questionText !== undefined) updateData.questionText = rest.questionText;
    if (rest.questionType !== undefined) updateData.questionType = rest.questionType;
    if (rest.required !== undefined) updateData.required = rest.required ? 1 : 0;
    if (rest.options !== undefined) updateData.options = Array.isArray(rest.options) ? rest.options : [];
    if (rest.questionImage !== undefined) updateData.questionImage = rest.questionImage;
    return updateData;
  };

  const readResponseBody = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    return await res.text();
  };

  // API: Update form details (name, desc, toggles)
  const updateFormDetails = async () => {
    const token = getToken();
    if (!token) throw new Error("No token");

    const payload = {
      formId: formId,
      name: formName,
      description: formDescription,
      indicator: Number(allowAnonymous),
      locked: Number(isLocked),
      collaborators: collaborators,
      observers: observers,
    };

    console.log("🚀 Sending Form Update to /updateForm:", {
      method: "PUT",
      body: payload,
    });

    const res = await fetch(`${apiBase}/forms/updateForm`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await readResponseBody(res);
    if (!res.ok) {
      throw new Error(`Failed to update form details: ${JSON.stringify(body)}`);
    }
    console.log("✅ Form Details Update successful:", body);
    return body;
  };

  // API: Update one existing question
  const updateOneQuestion = async (q) => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const nested = { questionId: q._id, updateData: sanitizeForUpdate(q) };
    const formData = new FormData();
    formData.append("updateData", JSON.stringify(nested));

    console.log("🚀 Sending Question Update:", { formDataContent: nested });

    const res = await fetch(`${apiBase}/questions/updateQuestion`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await readResponseBody(res);
    if (!res.ok) throw new Error(`Update failed for question ${q._id}: ${JSON.stringify(body)}`);
    return body;
  };

  // API: Add all new questions
  const addNewQuestions = async (newQuestions) => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const formData = new FormData();
    const formDataJson = { formId, questions: newQuestions.map(sanitizeForCreate) };
    formData.append("formData", JSON.stringify(formDataJson));

    console.log("🚀 Sending New Questions:", { formDataContent: formDataJson });

    const res = await fetch(`${apiBase}/questions/addQuestions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await readResponseBody(res);
    if (!res.ok) throw new Error(`Add questions failed: ${JSON.stringify(body)}`);
    return body;
  };

  // API: Delete one existing question
  const deleteOneQuestion = async (questionId) => {
     const token = getToken();
    if (!token) throw new Error("No token");

    console.log("🚀 Sending Question Deletion (JSON):", { questionId });
    const res = await fetch(`${apiBase}/questions/deleteQuestion`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ questionId }),
    });

    const body = await readResponseBody(res);
    if (!res.ok) throw new Error(`Delete failed for question ${questionId}: ${JSON.stringify(body)}`);
    return body;
  };

  // Save: Update form details, then add/update questions
  const handleSaveAll = async () => {
    setIsSaving(true);
    setError("");
    try {
      await updateFormDetails();

      const existing = questions.filter((q) => q._id);
      const newOnes = questions.filter((q) => !q._id);

      if (newOnes.length > 0) {
        await addNewQuestions(newOnes);
      }
      for (const q of existing) {
        await updateOneQuestion(q);
      }

      alert("Form and questions saved successfully!");
      navigate('/');

    } catch (e) {
      console.error("Save failed:", e);
      setError(e.message || String(e));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Immediate delete for existing question
  const handleDeleteExistingQuestion = async (q) => {
    if (!q?._id) return;
    const ok = window.confirm("Delete this question from the server? This cannot be undone.");
    if (!ok) return;

    try {
      await deleteOneQuestion(q._id);
      setQuestions((prev) => prev.filter((x) => x._id !== q._id));
    } catch (e) {
      console.error("Delete question failed:", e);
      setError(e.message || String(e));
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <div className="form-container" style={{ maxWidth: 900, margin: "auto", paddingBottom: "5rem" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h4" gutterBottom>Edit Form</Typography>

      <TextField fullWidth label="Form Name" value={formName} onChange={(e) => setFormName(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth multiline label="Form Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} sx={{ mb: 2 }} />

      <FormGroup sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
        <FormControlLabel control={<Switch checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} />} label="Enable Anonymous Submissions" />
        <FormControlLabel control={<Switch checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />} label="Lock Form (prevents new answers)" />
      </FormGroup>


       

      
      <Typography variant="h5" sx={{ my: 2 }}>Questions</Typography>
      <div className="questions-section">
        {questions.map((q, index) => (
          <div key={q.tempId} className="question-form" style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <TextField
              fullWidth
              label={`Question ${index + 1}`}
              value={q.questionText || ""}
              onChange={(e) => handleUpdateQuestionLocal(q.tempId, "questionText", e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={q.questionType || "short-text"}
                onChange={(e) => handleUpdateQuestionLocal(q.tempId, "questionType", e.target.value)}
              >
                <MenuItem value="short-text">Short Text</MenuItem>
                <MenuItem value="long-text">Long Text</MenuItem>
                <MenuItem value="multiple-choice-single">Single Choice</MenuItem>
                <MenuItem value="multiple-choice-multiple">Multiple Choice</MenuItem>
                <MenuItem value="numeric">Numeric</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="time">Time</MenuItem>
              </Select>
            </FormControl>

            {(q.questionType === "multiple-choice-single" || q.questionType === "multiple-choice-multiple") && (
              <div style={{ marginTop: 16 }}>
                <Typography variant="subtitle2">Options</Typography>
                {(q.options || []).map((opt, optIdx) => (
                  <Box key={optIdx} display="flex" alignItems="center" mb={1}>
                    <TextField
                      placeholder={`Option ${optIdx + 1}`}
                      fullWidth
                      value={opt?.text ?? ""}
                      onChange={(e) => {
                        const options = Array.isArray(q.options) ? [...q.options] : [];
                        options[optIdx] = { text: e.target.value };
                        handleUpdateQuestionLocal(q.tempId, "options", options);
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        const options = (q.options || []).filter((_, i) => i !== optIdx);
                        handleUpdateQuestionLocal(q.tempId, "options", options);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={() => handleUpdateQuestionLocal(q.tempId, "options", [...(q.options || []), { text: "" }])}>
                  Add Option
                </Button>
              </div>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} borderTop={1} borderColor="grey.300" pt={1}>
              <FormControlLabel
                control={<Switch checked={!!q.required} onChange={(e) => handleUpdateQuestionLocal(q.tempId, "required", e.target.checked)} />}
                label="Required"
              />
              <div>
                <IconButton title="Move Up" disabled={index === 0} onClick={() => handleMoveQuestion(index, "up")}><ArrowUpwardIcon /></IconButton>
                <IconButton title="Move Down" disabled={index === questions.length - 1} onClick={() => handleMoveQuestion(index, "down")}><ArrowDownwardIcon /></IconButton>
                {q._id ? (
                  <IconButton title="Delete (from server)" color="error" onClick={() => handleDeleteExistingQuestion(q)}>
                    <DeleteIcon />
                  </IconButton>
                ) : (
                  <IconButton title="Remove (local only)" color="secondary" onClick={() => handleRemoveNewQuestionLocal(q.tempId)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </div>
            </Box>
          </div>
        ))}
      </div>
      {isCreator && (
        <Box sx={{ my: 2, p: 2, border: '1px solid #1976d2', borderRadius: 1, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate(`/forms/menage/${formId}`)}
          >
            Manage Collaborators
          </Button>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate(`/forms/menage/${formId}`)}
          >
            Manage Observers
          </Button>
        </Box>
      )}
      <Button variant="outlined" color="primary" onClick={handleAddQuestionLocal} sx={{ mt: 2 }}>
        Add Question
      </Button>
      <Button variant="contained" color="success" onClick={handleSaveAll} disabled={isSaving} sx={{ mt: 2, ml: 2 }}>
        {isSaving ? <CircularProgress size={24} /> : "Save All Changes"}
      </Button>
    </div>
  );
}

export default EditFormPage;