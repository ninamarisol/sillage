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
      setLocation("/dashboard");
    } catch {
      try {
        const res = await apiRequest("POST", "/api/auth/register", {
          username: email.trim(),
          password,
          displayName: email.split("@")[0] || email.trim(),
          accessCode: "SILLAGE_DEMO",
        });
        const data = await res.json();
        storeUser(data.user);
        setLocation("/dashboard");
      } catch {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "40px",
    color: "#ffffff",
    fontSize: "15px",
    letterSpacing: "0.03em",
    outline: "none",
    fontFamily: "'Cormorant', Georgia, serif",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease",
    textAlign: "center",
  };

  const violet = "rgba(138,100,220,1)";
  const violetDim = "rgba(138,100,220,0.4)";
  const gold = "rgba(212,175,55,1)";

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
        fontFamily: "'Cormorant', Georgia, serif",
        overflow: "auto",
      }}
    >
      <div style={{ textAlign: "center", width: "min(400px, 85vw)", animation: "fadeUp 0.6s ease-out" }}>
        <h1 style={{
          color: gold,
          fontFamily: "'Pinyon Script', cursive",
          fontSize: "clamp(42px, 10vw, 64px)",
          marginBottom: "8px",
          fontWeight: 400,
        }}>
          Sillage
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: "15px",
          fontStyle: "italic",
          letterSpacing: "0.06em",
          marginBottom: "56px",
          fontFamily: "'Cormorant', Georgia, serif",
        }}>
          The luxury fragrance vault.
        </p>

        {flow === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeUp 0.5s ease-out" }}>
            <button
              data-testid="button-new-user"
              onClick={() => { setFlow("new"); setError(""); }}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: "transparent",
                border: `1.5px solid ${violetDim}`,
                borderRadius: "40px",
                color: "rgba(255,255,255,0.75)",
                fontSize: "15px",
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "'Cormorant', Georgia, serif",
                transition: "all 0.3s ease",
              }}
            >
              I'm new — I have a code
            </button>
            <button
              data-testid="button-returning-user"
              onClick={() => { setFlow("returning"); setError(""); }}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: violet,
                border: `1.5px solid ${violet}`,
                borderRadius: "40px",
                color: "#ffffff",
                fontSize: "15px",
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "'Cormorant', Georgia, serif",
                transition: "all 0.3s ease",
              }}
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
              color: "rgba(255,255,255,0.25)",
              fontSize: "12px",
              marginTop: "14px",
              marginBottom: "28px",
              lineHeight: 1.7,
              letterSpacing: "0.04em",
            }}>
              Codes are distributed by FragranceTok creators you love.
            </p>

            {error && (
              <p data-testid="text-error" style={{ color: "rgba(200,80,80,0.8)", fontSize: "13px", marginBottom: "14px" }}>
                {error}
              </p>
            )}

            <button
              data-testid="button-enter-vault"
              onClick={handleNewUser}
              disabled={loading || !code.trim()}
              style={{
                width: "100%",
                padding: "16px",
                background: code.trim() ? violet : "rgba(255,255,255,0.03)",
                border: `1px solid ${code.trim() ? violet : "rgba(255,255,255,0.08)"}`,
                borderRadius: "40px",
                color: code.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: "14px",
                letterSpacing: "0.12em",
                cursor: code.trim() ? "pointer" : "default",
                fontFamily: "'Cormorant', Georgia, serif",
                transition: "all 0.3s ease",
                marginBottom: "20px",
              }}
            >
              {loading ? "..." : "Enter the vault \u2192"}
            </button>

            <p
              data-testid="button-back-choose"
              onClick={() => { setFlow("choose"); setError(""); }}
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
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
              placeholder="Email or username"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              style={{ ...inputStyle, marginBottom: "14px" }}
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
              <p data-testid="text-error" style={{ color: "rgba(200,80,80,0.8)", fontSize: "13px", marginTop: "14px" }}>
                {error}
              </p>
            )}

            <button
              data-testid="button-enter"
              onClick={handleReturningUser}
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                width: "100%",
                padding: "16px",
                background: (email.trim() && password.trim()) ? violet : "rgba(255,255,255,0.03)",
                border: `1px solid ${(email.trim() && password.trim()) ? violet : "rgba(255,255,255,0.08)"}`,
                borderRadius: "40px",
                color: (email.trim() && password.trim()) ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: "14px",
                letterSpacing: "0.12em",
                cursor: (email.trim() && password.trim()) ? "pointer" : "default",
                fontFamily: "'Cormorant', Georgia, serif",
                transition: "all 0.3s ease",
                marginTop: "24px",
                marginBottom: "20px",
              }}
            >
              {loading ? "..." : "Enter \u2192"}
            </button>

            <p
              data-testid="button-back-choose"
              onClick={() => { setFlow("choose"); setError(""); }}
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
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
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
