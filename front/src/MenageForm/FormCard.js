import React from "react";
import { Card, CardContent, Typography, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

const FormCard = ({ form }) => {
  const navigate = useNavigate();

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevents card click if you add that later
    navigate(`/FormEdit/${form._id}`);
  };

  const handleAnswer = () => {
    navigate(`/FormAnswering/${form._id}`);
  };

  return (
    <Card
      style={{
        position: "relative",
        margin: "16px",
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        transition: "box-shadow 0.2s",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)")}
      onMouseOut={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)")}
    >
      {/* Edit button in upper right */}
      <IconButton
        onClick={handleEdit}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
        }}
        aria-label="edit"
        size="large"
      >
        <EditIcon />
      </IconButton>

      <CardContent>
        <Typography variant="h5">{form.name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {form.description}
        </Typography>
        <input type="hidden" value={form._id} />
      </CardContent>
      <Button
        onClick={handleAnswer}
        variant="outlined"
        style={{ marginTop: "16px" }}
      >
        Start Answering
      </Button>
    </Card>
  );
};

export default FormCard;