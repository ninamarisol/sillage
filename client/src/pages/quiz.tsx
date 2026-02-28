import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getStoredUser, storeUser } from "@/lib/auth";
import {
  QUIZ_SEASONS, QUIZ_SETTINGS, QUIZ_SCENT_VIBES,
  QUIZ_NOTE_FAMILIES, QUIZ_VIBES, ARCHETYPES,
  type ArchetypeId,
} from "@shared/schema";

const TOTAL_STEPS = 5;

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [season, setSeason] = useState("");
  const [settings, setSettings] = useState<string[]>([]);
  const [scentVibes, setScentVibes] = useState<string[]>([]);
  const [noteLikes, setNoteLikes] = useState<string[]>([]);
  const [noteDislikes, setNoteDislikes] = useState<string[]>([]);
  const [vibeAnswers, setVibeAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [revealArchetype, setRevealArchetype] = useState<ArchetypeId | null>(null);
  const [revealOpacity, setRevealOpacity] = useState(0);
  const [, setLocation] = useLocation();
  const user = getStoredUser();

  useEffect(() => {
    if (!user) setLocation("/access");
  }, [user, setLocation]);

  const toggleArray = (arr: string[], val: string, setter: (a: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const toggleNote = (id: string, type: "like" | "dislike") => {
    if (type === "like") {
      setNoteDislikes(noteDislikes.filter(n => n !== id));
      setNoteLikes(noteLikes.includes(id) ? noteLikes.filter(n => n !== id) : [...noteLikes, id]);
    } else {
      setNoteLikes(noteLikes.filter(n => n !== id));
      setNoteDislikes(noteDislikes.includes(id) ? noteDislikes.filter(n => n !== id) : [...noteDislikes, id]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!season;
      case 1: return settings.length > 0;
      case 2: return scentVibes.length > 0;
      case 3: return noteLikes.length > 0 || noteDislikes.length > 0;
      case 4: return Object.keys(vibeAnswers).length >= 3;
      default: return false;
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/users/${user.id}/complete-quiz`, {
        seasonPreference: season,
        settingPreferences: settings,
        scentPreferences: scentVibes,
        noteLikes,
        noteDislikes,
        vibeAnswers,
      });
      const data = await res.json();
      storeUser(data.user);
      setRevealArchetype(data.archetypeId);
      setTimeout(() => setRevealOpacity(1), 100);
      setTimeout(() => setLocation("/dashboard"), 4000);
    } catch {
      setSubmitting(false);
    }
  };

  if (revealArchetype) {
    const arch = ARCHETYPES[revealArchetype];
    return (
      <div data-testid="reveal-page" style={{
        position: "fixed", inset: 0, background: "#000",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant', Georgia, serif",
        opacity: revealOpacity, transition: "opacity 1.5s ease-in-out",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "20px" }}>
          Your Sillage is
        </p>
        <h1 data-testid="text-archetype-name" style={{
          color: "#fff", fontFamily: "'Pinyon Script', cursive", fontSize: "clamp(40px, 10vw, 72px)",
          fontWeight: 400, marginBottom: "16px", textShadow: `0 0 60px ${arch.color}40`,
        }}>
          {arch.name}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "24px" }}>
          {arch.tagline}
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", maxWidth: "400px", textAlign: "center", lineHeight: 1.8, padding: "0 24px" }}>
          {arch.description}
        </p>
        <style>{`body { margin: 0; background: #000 !important; }`}</style>
      </div>
    );
  }

  const seasonImages: Record<string, string> = { Spring: "🌸", Summer: "☀️", Fall: "🍂", Winter: "❄️" };

  const chipStyle = (active: boolean) => ({
    padding: "10px 20px",
    background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: "4px",
    color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.3s ease",
    letterSpacing: "0.05em",
  });

  return (
    <div data-testid="quiz-page" style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Cormorant', Georgia, serif", overflow: "auto",
    }}>
      <div style={{ width: "min(480px, 90vw)", paddingTop: "clamp(40px, 8vh, 80px)", paddingBottom: "120px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "48px" }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "2px",
              background: i <= step ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
              borderRadius: "1px", transition: "background 0.5s ease",
            }} />
          ))}
        </div>

        {step === 0 && (
          <div data-testid="quiz-step-season" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "12px" }}>
              Discover Your Sillage
            </p>
            <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 300, marginBottom: "40px", lineHeight: 1.4 }}>
              Which season feels most like you?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {QUIZ_SEASONS.map(s => (
                <button key={s} data-testid={`button-season-${s.toLowerCase()}`} onClick={() => setSeason(s)} style={{
                  ...chipStyle(season === s), padding: "24px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ fontSize: "28px" }}>{seasonImages[s]}</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div data-testid="quiz-step-settings" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 300, marginBottom: "12px", lineHeight: 1.4 }}>
              Where do you reach for fragrance?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "32px" }}>Select all that apply</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {QUIZ_SETTINGS.map(s => (
                <button key={s} data-testid={`button-setting-${s.toLowerCase().replace(/\s/g, '-')}`} onClick={() => toggleArray(settings, s, setSettings)} style={chipStyle(settings.includes(s))}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="quiz-step-vibes" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 300, marginBottom: "12px", lineHeight: 1.4 }}>
              How do you want to smell?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "32px" }}>Select all that resonate</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {QUIZ_SCENT_VIBES.map(v => (
                <button key={v} data-testid={`button-vibe-${v.toLowerCase()}`} onClick={() => toggleArray(scentVibes, v, setScentVibes)} style={chipStyle(scentVibes.includes(v))}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div data-testid="quiz-step-notes" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 300, marginBottom: "12px", lineHeight: 1.4 }}>
              Explore scent families
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "32px" }}>Heart to love, X to pass</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {QUIZ_NOTE_FAMILIES.map(fam => {
                const liked = noteLikes.includes(fam.id);
                const disliked = noteDislikes.includes(fam.id);
                return (
                  <div key={fam.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 18px",
                    background: liked ? "rgba(255,255,255,0.08)" : disliked ? "rgba(200,60,60,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${liked ? "rgba(255,255,255,0.2)" : disliked ? "rgba(200,60,60,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "4px", transition: "all 0.3s ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "20px" }}>{fam.icon}</span>
                      <div>
                        <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>{fam.label}</p>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "2px 0 0" }}>{fam.examples}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button data-testid={`button-like-${fam.id}`} onClick={() => toggleNote(fam.id, "like")} style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: liked ? "rgba(255,255,255,0.15)" : "transparent",
                        border: `1px solid ${liked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                        color: liked ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>♥</button>
                      <button data-testid={`button-dislike-${fam.id}`} onClick={() => toggleNote(fam.id, "dislike")} style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: disliked ? "rgba(200,60,60,0.15)" : "transparent",
                        border: `1px solid ${disliked ? "rgba(200,60,60,0.3)" : "rgba(255,255,255,0.1)"}`,
                        color: disliked ? "rgba(200,80,80,0.8)" : "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div data-testid="quiz-step-identity" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 300, marginBottom: "32px", lineHeight: 1.4 }}>
              A few more about you...
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {Object.entries(QUIZ_VIBES).map(([key, vibe]) => (
                <div key={key}>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "12px", fontWeight: 300 }}>
                    {vibe.question}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {vibe.options.map(opt => (
                      <button key={opt} data-testid={`button-vibe-${key}-${opt.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        onClick={() => setVibeAnswers({ ...vibeAnswers, [key]: opt })}
                        style={chipStyle(vibeAnswers[key] === opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "20px", display: "flex", justifyContent: "center",
        background: "linear-gradient(transparent, #000 50%)",
      }}>
        <div style={{ width: "min(480px, 90vw)", display: "flex", gap: "12px" }}>
          {step > 0 && (
            <button data-testid="button-back" onClick={() => setStep(step - 1)} style={{
              padding: "14px 24px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px",
              color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.2em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
            }}>
              Back
            </button>
          )}
          <button
            data-testid="button-next"
            onClick={() => step < TOTAL_STEPS - 1 ? setStep(step + 1) : handleComplete()}
            disabled={!canProceed() || submitting}
            style={{
              flex: 1, padding: "14px",
              background: canProceed() ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${canProceed() ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "4px",
              color: canProceed() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
              fontSize: "12px", letterSpacing: "0.25em", textTransform: "uppercase",
              cursor: canProceed() ? "pointer" : "default",
              fontFamily: "'Cormorant', Georgia, serif", transition: "all 0.3s ease",
            }}
          >
            {submitting ? "Discovering..." : step < TOTAL_STEPS - 1 ? "Continue" : "Reveal My Sillage"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; background: #000 !important; }
        ::-webkit-scrollbar { width: 0; background: transparent; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
