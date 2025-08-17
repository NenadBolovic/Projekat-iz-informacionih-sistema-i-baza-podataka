import { jwtDecode } from "jwt-decode";

// Checks if a valid, non-expired token exists.
export function isAuthenticated() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem("token"); // Clear expired token
      return false;
    }
  } catch (e) {
    localStorage.removeItem("token"); // Clear invalid token
    return false;
  }
  return true;
}