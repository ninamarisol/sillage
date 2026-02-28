import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { storeUser } from "@/lib/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [, setLocation] = useLocation();

  const accessCode = localStorage.getItem("sillage_access_code") || "";

  useEffect(() => {
    if (!isLogin && !accessCode) {
      setLocation("/access");
    }
  }, [isLogin, accessCode, setLocation]);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const res = await apiRequest("POST", "/api/auth/login", { username: username.trim(), password });
        const data = await res.json();
        storeUser(data.user);
        if (data.user.onboardingComplete) {
          setLocation("/dashboard");
        } else {
          setLocation("/quiz");
        }
      } else {
        if (!displayName.trim()) { setError("Display name required"); setLoading(false); return; }
        const res = await apiRequest("POST", "/api/auth/register", {
          username: username.trim(),
          password,
          displayName: displayName.trim(),
          accessCode,
        });
        const data = await res.json();
        storeUser(data.user);
        setLocation("/quiz");
      }
    } catch {
      setError(isLogin ? "Invalid credentials" : "Username already taken");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "15px",
    letterSpacing: "0.03em",
    outline: "none",
    fontFamily: "'Cormorant', Georgia, serif",
    boxSizing: "border-box" as const,
    transition: "border-color 0.3s ease",
    marginBottom: "14px",
  };

  return (
    <div
      data-testid="register-page"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant', Georgia, serif",
      }}
    >
      <div style={{ textAlign: "center", width: "min(400px, 85vw)" }}>
        <h1 style={{
          color: "#ffffff",
          fontFamily: "'Pinyon Script', cursive",
          fontSize: "clamp(36px, 8vw, 52px)",
          marginBottom: "8px",
          fontWeight: 400,
        }}>
          Sillage
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: "14px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "48px",
        }}>
          {isLogin ? "Welcome back" : "Create your account"}
        </p>

        {!isLogin && (
          <input
            data-testid="input-display-name"
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          data-testid="input-username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setError(""); }}
          style={inputStyle}
        />
        <input
          data-testid="input-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
        />

        {error && (
          <p data-testid="text-error" style={{
            color: "rgba(200,80,80,0.8)",
            fontSize: "13px",
            marginBottom: "14px",
            letterSpacing: "0.1em",
          }}>
            {error}
          </p>
        )}

        <button
          data-testid="button-submit"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "6px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'Cormorant', Georgia, serif",
            transition: "all 0.3s ease",
            marginBottom: "24px",
          }}
        >
          {loading ? "..." : (isLogin ? "Sign In" : "Continue")}
        </button>

        <p
          data-testid="link-toggle-auth"
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "13px",
            cursor: "pointer",
            letterSpacing: "0.08em",
            lineHeight: 1.6,
          }}
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </p>
      </div>

      <style>{`
        body { margin: 0; background: #000 !important; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
