import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Chat = lazy(() => import("./pages/Chat"));

const PageSpinner = () => (
  <div style={{
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-primary, #0f172a)",
    color: "#0078d4",
    gap: "1rem"
  }}>
    <div className="spinner" style={{
      width: "42px",
      height: "42px",
      border: "3.5px solid rgba(0, 120, 212, 0.2)",
      borderTop: "3.5px solid #0078d4",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-muted, #94a3b8)" }}>
      Loading LoopChat...
    </span>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Suspense>
  );
}

export default App;