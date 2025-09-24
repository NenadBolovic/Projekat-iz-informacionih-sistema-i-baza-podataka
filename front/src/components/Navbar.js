import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Box,
  Badge
} from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../Usercontext/UserContext";
import Plus from "../pictures/plus.svg";
import formIcon from "../pictures/icon1.png";
import "./navbar.css";

const ROUTES_WITH_SEARCH = ["/"]; // ako kasnije želiš i druge rute

const Navbar = () => {
  const { username, setUsername } = useUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUsername("");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded?.username) {
        setUsername(decoded.username);
      } else if (decoded?.user?.username) {
        setUsername(decoded.user.username);
      } else {
        setUsername("");
      }
    } catch (err) {
      console.error("Error decoding token:", err);
      localStorage.removeItem("token");
      setUsername("");
    }
  }, [setUsername]);

  const isAuthenticated = useMemo(() => {
    const token = localStorage.getItem("token");
    return Boolean(token && username);
  }, [username]);

  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUsername("");
    window.location.reload();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchQuery)}`, { replace: true });
  };

  // Helper za aktivnu rutu (case-insensitive)
  const isActive = (path) =>
    location.pathname.toLowerCase() === path.toLowerCase();

  return (
    <header className="nav-root">
      <div className="nav-inner">
        <div className="nav-left">
          <Link to="/" className="brand">
            <img className="brand-icon" src={formIcon} alt="Logo" />
            <span className="brand-text">Forms</span>
            <span className="brand-pill">App</span>
          </Link>

          <nav className="main-links">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/MenageForms"
                className={`nav-link ${
                  isActive("/MenageForms") ? "active" : ""
                }`}
              >
                My Forms
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/form"
                className={`nav-link ${isActive("/form") ? "active" : ""}`}
              >
                Create
              </Link>
            )}
          </nav>
        </div>

        {ROUTES_WITH_SEARCH.includes(location.pathname) && (
          <form className="searchBox" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="searchInput"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search forms"
            />
            <button type="submit" className="searchButton" aria-label="Search">
              🔍
            </button>
          </form>
        )}

        <div className="nav-right">
          

            <div className="user-chip">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  maxWidth: 130,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {isAuthenticated ? username : "Guest"}
              </Box>
              <Tooltip title="Account menu">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  sx={{
                    padding: 0.5,
                    border: "2px solid rgba(255,255,255,0.35)",
                    transition: "all .25s",
                    "&:hover": { borderColor: "white", transform: "scale(1.05)" },
                  }}
                >
                  <Badge
                    variant="dot"
                    color={isAuthenticated ? "success" : "default"}
                    overlap="circular"
                  >
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "rgba(255,255,255,0.2)",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#fff",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {isAuthenticated && username
                        ? username.slice(0, 2).toUpperCase()
                        : "G"}
                    </Avatar>
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 170,
                    borderRadius: 2,
                    bgcolor: "#35265a",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow:
                      "0 8px 28px -4px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.35)",
                    "& .MuiMenuItem-root": {
                      fontSize: 14,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.08)",
                      },
                    },
                  },
                }}
              >
                {!isAuthenticated ? (
                  <>
                    <MenuItem onClick={handleClose}>
                      <Link
                        to="/login"
                        className="menu-link"
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                          width: "100%",
                        }}
                      >
                        Log In
                      </Link>
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <Link
                        to="/signup"
                        className="menu-link"
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                          width: "100%",
                        }}
                      >
                        Sign Up
                      </Link>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    
                    <MenuItem
                      onClick={() => {
                        handleClose();
                        handleLogout();
                      }}
                    >
                      Logout
                    </MenuItem>
                  </>
                )}
              </Menu>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;