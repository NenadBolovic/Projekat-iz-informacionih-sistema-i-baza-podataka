import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../Usercontext/UserContext";
import Plus from "../pictures/plus.svg";
import formIcon from "../pictures/icon1.png";
import "./navbar.css";

const Navbar = () => {
  const { username, setUsername } = useUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // No changes to this part
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

  // --- THIS IS THE NEW SEARCH SUBMIT HANDLER ---
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevents the page from reloading on submit
    navigate(`/?search=${searchQuery}`, { replace: true });
  };

  return (
    <header className="nav">
      {isAuthenticated && (
        <Link to="/form">
          <IconButton className="menu-icon">
            <img className="small-plus-icon" src={Plus} alt="Plus" />
            New Form
          </IconButton>
        </Link>
      )}

      <Link to="/" className="logo">
        <img className="form-icon" src={formIcon} alt="Logo" />
        <span className="info">Forms</span>
      </Link>

      {/* The search box is now a form with an onSubmit handler */}
      {location.pathname === "/" && (
        <form className="searchBox" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="searchInput"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="searchButton">🔍</button>
        </form>
      )}

      <div className="user-info">
        <div className="Naziv">
          {isAuthenticated ? username : "Guest"}
        </div>
        <div className="header-avatar">
          <IconButton onClick={handleClick}>
            <Avatar />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {!isAuthenticated ? (
              [
                <MenuItem key="login" onClick={handleClose}>
                  <Link to="/login" className="menu-link">Log In</Link>
                </MenuItem>,
                <MenuItem key="signup" onClick={handleClose}>
                  <Link to="/signup" className="menu-link">Sign Up</Link>
                </MenuItem>
              ]
            ) : (
              [
                <MenuItem key="delete-forms" onClick={handleClose}>
                  <Link to="/MenageForms" className="menu-link" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                    Manage Forms
                  </Link>
                </MenuItem>,
                <MenuItem key="logout" onClick={handleLogout}>
                  Logout
                </MenuItem>
              ]
            )}
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;