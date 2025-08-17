import Plus from "../pictures/plus.svg";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./card.css";

function Card() {
    const navigate = useNavigate(); 

    return (
        <div className="card" onClick={() => navigate("/form")}>
            <img className="card-icon" src={Plus} alt="Plus" />
            <p className="card-text">New Form</p>
        </div>
    );
}

export default Card;
