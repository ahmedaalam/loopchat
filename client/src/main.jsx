import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Apply saved theme before React mounts to avoid flash
const savedTheme = localStorage.getItem("lc-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);