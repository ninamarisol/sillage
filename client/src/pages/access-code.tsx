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
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
            Invited by
          </p>
          <p style={{ color: "#ffffff", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 300 }}>
            {creatorName}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", width: "min(360px, 85vw)" }}>
          <h1 style={{ color: "#ffffff", fontFamily: "'Pinyon Script', cursive", fontSize: "clamp(36px, 8vw, 56px)", marginBottom: "8px", fontWeight: 400 }}>
            Sillage
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "48px" }}>
            Members Only
          </p>

          <div style={{ marginBottom: "16px" }}>
            <input
              data-testid="input-access-code"
              type="text"
              placeholder="Enter your access code"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "4px",
                color: "#ffffff",
                fontSize: "14px",
                letterSpacing: "0.15em",
                textAlign: "center",
                outline: "none",
                fontFamily: "'Cormorant', Georgia, serif",
                textTransform: "uppercase",
                boxSizing: "border-box",
                transition: "border-color 0.3s ease",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>

          {error && (
            <p data-testid="text-error" style={{ color: "rgba(200,80,80,0.8)", fontSize: "12px", marginBottom: "16px", letterSpacing: "0.1em" }}>
              {error}
            </p>
          )}

          <button
            data-testid="button-enter"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background: code.trim() ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px",
              color: code.trim() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
              fontSize: "12px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: code.trim() ? "pointer" : "default",
              fontFamily: "'Cormorant', Georgia, serif",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Verifying..." : "Enter"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", marginTop: "32px", lineHeight: 1.6 }}>
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
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}
