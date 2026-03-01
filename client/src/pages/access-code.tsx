import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { storeUser } from "@/lib/auth";

type Flow = "choose" | "new" | "returning";

export default function AccessCode() {
  const [flow, setFlow] = useState<Flow>("choose");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleNewUser = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest("POST", "/api/access-code/validate", { code: code.trim().toUpperCase() });
      const username = `user_${Date.now()}`;
      const res = await apiRequest("POST", "/api/auth/register", {
        username,
        password: code.trim(),
        displayName: username.replace("_", "."),
        accessCode: code.trim().toUpperCase(),
      });
      const data = await res.json();
      storeUser(data.user);
      localStorage.setItem("sillage_access_code", code.trim().toUpperCase());
      setLocation("/quiz");
    } catch {
      setError("Invalid access code. Check with your creator.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturningUser = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username: email.trim(), password });
      const data = await res.json();
      storeUser(data.user);
      if (data.user.onboardingComplete) {
        setLocation("/dashboard");
      } else {
        setLocation("/quiz");
      }
    } catch {
      setError("Account not found. Check your credentials or sign up with a code.");
    } finally {
      setLoading(false);
    }
  };

  const accent = "#d4b8a0";
  const accentDim = "rgba(212,184,160,0.35)";
  const cream = "#eddfd9";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "18px 24px",
    background: "rgba(212,184,160,0.08)",
    border: "1px solid rgba(212,184,160,0.35)",
    borderRadius: "40px",
    color: cream,
    fontSize: "16px",
    letterSpacing: "0.03em",
    outline: "none",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease",
    textAlign: "center",
  };

  const pillBtn = (filled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "18px 28px",
    background: filled ? accent : "transparent",
    border: `1.5px solid ${filled ? accent : accentDim}`,
    borderRadius: "40px",
    color: filled ? "#000" : "rgba(237,223,217,0.85)",
    fontSize: "17px",
    letterSpacing: "0.04em",
    cursor: "pointer",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    transition: "all 0.3s ease",
  });

  return (
    <div
      data-testid="access-code-page"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        overflow: "auto",
      }}
    >
      <div style={{ textAlign: "center", width: "min(420px, 88vw)", animation: "fadeUp 0.7s ease-out" }}>
        <h1 style={{
          color: cream,
          fontFamily: "'Pinyon Script', cursive",
          fontSize: "clamp(48px, 12vw, 72px)",
          marginBottom: "10px",
          fontWeight: 400,
          lineHeight: 1,
        }}>
          Sillage
        </h1>
        <p style={{
          color: "rgba(212,184,160,0.6)",
          fontSize: "17px",
          fontStyle: "italic",
          letterSpacing: "0.08em",
          marginBottom: "64px",
          lineHeight: 1.6,
        }}>
          The luxury fragrance vault.
        </p>

        {flow === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "fadeUp 0.5s ease-out" }}>
            <button
              data-testid="button-new-user"
              onClick={() => { setFlow("new"); setError(""); }}
              style={pillBtn(false)}
            >
              I'm new &mdash; I have a code
            </button>
            <button
              data-testid="button-returning-user"
              onClick={() => { setFlow("returning"); setError(""); }}
              style={pillBtn(true)}
            >
              Welcome back
            </button>
          </div>
        )}

        {flow === "new" && (
          <div style={{ animation: "fadeUp 0.5s ease-out" }}>
            <input
              data-testid="input-access-code"
              type="text"
              placeholder="Enter your creator access code"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleNewUser()}
              style={inputStyle}
            />
            <p style={{
              color: "rgba(212,184,160,0.45)",
              fontSize: "14px",
              marginTop: "16px",
              marginBottom: "32px",
              lineHeight: 1.8,
            }}>
              Codes are distributed by FragranceTok creators you love.
            </p>

            {error && (
              <p data-testid="text-error" style={{ color: "rgba(220,120,100,0.85)", fontSize: "15px", marginBottom: "16px", lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <button
              data-testid="button-enter-vault"
              onClick={handleNewUser}
              disabled={loading || !code.trim()}
              style={{
                ...pillBtn(!!code.trim()),
                opacity: code.trim() ? 1 : 0.3,
                cursor: code.trim() ? "pointer" : "default",
                marginBottom: "24px",
              }}
            >
              {loading ? "Verifying..." : "Enter the vault"}
            </button>

            <p
              data-testid="button-back-choose"
              onClick={() => { setFlow("choose"); setError(""); }}
              style={{ color: "rgba(212,184,160,0.5)", fontSize: "15px", cursor: "pointer", letterSpacing: "0.06em" }}
            >
              Back
            </p>
          </div>
        )}

        {flow === "returning" && (
          <div style={{ animation: "fadeUp 0.5s ease-out" }}>
            <input
              data-testid="input-email"
              type="text"
              placeholder="Username"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              style={{ ...inputStyle, marginBottom: "12px" }}
            />
            <input
              data-testid="input-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReturningUser()}
              style={inputStyle}
            />

            {error && (
              <p data-testid="text-error" style={{ color: "rgba(220,120,100,0.85)", fontSize: "15px", marginTop: "16px", lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <button
              data-testid="button-enter"
              onClick={handleReturningUser}
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                ...pillBtn(!!(email.trim() && password.trim())),
                opacity: (email.trim() && password.trim()) ? 1 : 0.3,
                cursor: (email.trim() && password.trim()) ? "pointer" : "default",
                marginTop: "28px",
                marginBottom: "24px",
              }}
            >
              {loading ? "Signing in..." : "Enter"}
            </button>

            <p
              data-testid="button-back-choose"
              onClick={() => { setFlow("choose"); setError(""); }}
              style={{ color: "rgba(212,184,160,0.5)", fontSize: "15px", cursor: "pointer", letterSpacing: "0.06em" }}
            >
              Back
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; background: #000 !important; }
        input::placeholder { color: rgba(212,184,160,0.5); }
        input:focus { border-color: rgba(212,184,160,0.55) !important; }
      `}</style>
    </div>
  );
}
