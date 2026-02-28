import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AccessCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [validated, setValidated] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/access-code/validate", { code: code.trim() });
      const data = await res.json();
      setCreatorName(data.creatorName);
      setValidated(true);
      setTimeout(() => {
        localStorage.setItem("sillage_access_code", code.trim().toUpperCase());
        setLocation("/register");
      }, 1500);
    } catch {
      setError("Invalid access code");
    } finally {
      setLoading(false);
    }
  };

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
      }}
    >
      {validated ? (
        <div style={{ textAlign: "center", animation: "fadeUp 0.8s ease-out" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "16px" }}>
            Invited by
          </p>
          <p style={{ color: "#ffffff", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 300, lineHeight: 1.3 }}>
            {creatorName}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", width: "min(400px, 85vw)" }}>
          <h1 style={{
            color: "#ffffff",
            fontFamily: "'Pinyon Script', cursive",
            fontSize: "clamp(42px, 10vw, 64px)",
            marginBottom: "10px",
            fontWeight: 400,
          }}>
            Sillage
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "14px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "56px",
          }}>
            Members Only
          </p>

          <div style={{ marginBottom: "20px" }}>
            <input
              data-testid="input-access-code"
              type="text"
              placeholder="Enter your access code"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "16px",
                letterSpacing: "0.2em",
                textAlign: "center",
                outline: "none",
                fontFamily: "'Cormorant', Georgia, serif",
                textTransform: "uppercase",
                boxSizing: "border-box",
                transition: "border-color 0.3s ease",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {error && (
            <p data-testid="text-error" style={{
              color: "rgba(200,80,80,0.8)",
              fontSize: "13px",
              marginBottom: "16px",
              letterSpacing: "0.1em",
            }}>
              {error}
            </p>
          )}

          <button
            data-testid="button-enter"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background: code.trim() ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${code.trim() ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "6px",
              color: code.trim() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
              fontSize: "13px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: code.trim() ? "pointer" : "default",
              fontFamily: "'Cormorant', Georgia, serif",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Verifying..." : "Enter"}
          </button>

          <p style={{
            color: "rgba(255,255,255,0.18)",
            fontSize: "13px",
            marginTop: "40px",
            lineHeight: 1.7,
          }}>
            Access codes are distributed by partnered creators.
          </p>
        </div>
      )}

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
