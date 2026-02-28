import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getStoredUser, storeUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  QUIZ_SEASONS, QUIZ_SETTINGS, QUIZ_SCENT_VIBES,
  QUIZ_NOTE_FAMILIES, QUIZ_VIBES, ARCHETYPES,
  type ArchetypeId,
} from "@shared/schema";

const seasonLabels: Record<string, { sub: string }> = {
  Spring: { sub: "Bloom & renewal" },
  Summer: { sub: "Warmth & radiance" },
  Fall: { sub: "Depth & richness" },
  Winter: { sub: "Crisp & intimate" },
};

export default function Quiz() {
  const search = useSearch();
  const isRetake = search.includes("retake=true");
  const TOTAL_STEPS = isRetake ? 5 : 6;

  const [step, setStep] = useState(0);
  const [themeChoice, setThemeChoice] = useState<"light" | "dark">("dark");
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
  const { setTheme } = useTheme();

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

  const getActualStep = () => isRetake ? step + 1 : step;

  const canProceed = () => {
    const actual = getActualStep();
    switch (actual) {
      case 0: return true;
      case 1: return !!season;
      case 2: return settings.length > 0;
      case 3: return scentVibes.length > 0;
      case 4: return noteLikes.length > 0 || noteDislikes.length > 0;
      case 5: return Object.keys(vibeAnswers).length >= 3;
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
        themePreference: themeChoice,
      });
      const data = await res.json();
      storeUser(data.user);
      setTheme(themeChoice);
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
        padding: "24px",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "24px" }}>
          Your Sillage is
        </p>
        <h1 data-testid="text-archetype-name" style={{
          color: "#fff", fontFamily: "'Pinyon Script', cursive",
          fontSize: "clamp(44px, 12vw, 80px)",
          fontWeight: 400, marginBottom: "20px",
          textShadow: `0 0 70px ${arch.color}40`,
          textAlign: "center",
        }}>
          {arch.name}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", letterSpacing: "0.08em", marginBottom: "28px", fontStyle: "italic" }}>
          {arch.tagline}
        </p>
        <p style={{
          color: "rgba(255,255,255,0.35)", fontSize: "15px",
          maxWidth: "420px", textAlign: "center", lineHeight: 1.8,
        }}>
          {arch.description}
        </p>
        <style>{`body { margin: 0; background: #000 !important; }`}</style>
      </div>
    );
  }

  const chipStyle = (active: boolean) => ({
    padding: "12px 22px",
    background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.025)",
    border: `1px solid ${active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "6px",
    color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.25s ease",
    letterSpacing: "0.03em",
  });

  const actualStep = getActualStep();

  return (
    <div data-testid="quiz-page" style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Cormorant', Georgia, serif", overflow: "auto",
    }}>
      <div style={{ width: "min(500px, 90vw)", paddingTop: "clamp(40px, 8vh, 80px)", paddingBottom: "140px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "56px" }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "2px",
              background: i <= step ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.07)",
              borderRadius: "1px", transition: "background 0.5s ease",
            }} />
          ))}
        </div>

        {actualStep === 0 && (
          <div data-testid="quiz-step-theme" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>
              Welcome to Sillage
            </p>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "16px", lineHeight: 1.4 }}>
              Choose your aesthetic
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", marginBottom: "40px", lineHeight: 1.6 }}>
              You can always change this later in your profile.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <button
                data-testid="button-theme-light"
                onClick={() => setThemeChoice("light")}
                style={{
                  padding: "32px 20px",
                  background: themeChoice === "light" ? "rgba(255,248,245,0.12)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${themeChoice === "light" ? "rgba(255,248,245,0.35)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{
                  width: "60px", height: "40px", borderRadius: "6px",
                  background: "linear-gradient(135deg, #FFF8F5, #F5E6DF)",
                  border: "1px solid rgba(200,180,170,0.3)",
                }} />
                <span style={{
                  fontSize: "15px", fontFamily: "'Cormorant', Georgia, serif",
                  color: themeChoice === "light" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                }}>
                  Light
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                  Warm, creamy, soft
                </span>
              </button>
              <button
                data-testid="button-theme-dark"
                onClick={() => setThemeChoice("dark")}
                style={{
                  padding: "32px 20px",
                  background: themeChoice === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${themeChoice === "dark" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{
                  width: "60px", height: "40px", borderRadius: "6px",
                  background: "linear-gradient(135deg, #111, #000)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }} />
                <span style={{
                  fontSize: "15px", fontFamily: "'Cormorant', Georgia, serif",
                  color: themeChoice === "dark" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                }}>
                  Dark
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                  Moody, editorial
                </span>
              </button>
            </div>
          </div>
        )}

        {actualStep === 1 && (
          <div data-testid="quiz-step-season" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>
              Discover Your Sillage
            </p>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "48px", lineHeight: 1.4 }}>
              Which season feels most like you?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {QUIZ_SEASONS.map(s => (
                <button key={s} data-testid={`button-season-${s.toLowerCase()}`} onClick={() => setSeason(s)} style={{
                  ...chipStyle(season === s), padding: "28px 20px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                }}>
                  <span style={{ fontSize: "17px", fontWeight: 400 }}>{s}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                    {seasonLabels[s]?.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {actualStep === 2 && (
          <div data-testid="quiz-step-settings" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "14px", lineHeight: 1.4 }}>
              Where do you reach for fragrance?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "36px", lineHeight: 1.5 }}>Select all that apply</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {QUIZ_SETTINGS.map(s => (
                <button key={s} data-testid={`button-setting-${s.toLowerCase().replace(/\s/g, '-')}`} onClick={() => toggleArray(settings, s, setSettings)} style={chipStyle(settings.includes(s))}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {actualStep === 3 && (
          <div data-testid="quiz-step-vibes" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "14px", lineHeight: 1.4 }}>
              How do you want to smell?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "36px", lineHeight: 1.5 }}>Select all that resonate</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {QUIZ_SCENT_VIBES.map(v => (
                <button key={v} data-testid={`button-vibe-${v.toLowerCase()}`} onClick={() => toggleArray(scentVibes, v, setScentVibes)} style={chipStyle(scentVibes.includes(v))}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {actualStep === 4 && (
          <div data-testid="quiz-step-notes" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "14px", lineHeight: 1.4 }}>
              Explore scent families
            </h2>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "36px", lineHeight: 1.5 }}>
              Heart to love, X to pass
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {QUIZ_NOTE_FAMILIES.map(fam => {
                const liked = noteLikes.includes(fam.id);
                const disliked = noteDislikes.includes(fam.id);
                return (
                  <div key={fam.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px",
                    background: liked ? "rgba(255,255,255,0.06)" : disliked ? "rgba(200,60,60,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${liked ? "rgba(255,255,255,0.18)" : disliked ? "rgba(200,60,60,0.18)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "8px", transition: "all 0.25s ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)",
                        fontFamily: "'Cormorant', Georgia, serif", flexShrink: 0,
                      }}>{fam.icon}</span>
                      <div>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: 400 }}>{fam.label}</p>
                        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "13px", margin: "3px 0 0" }}>{fam.examples}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button data-testid={`button-like-${fam.id}`} onClick={() => toggleNote(fam.id, "like")} style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: liked ? "rgba(255,255,255,0.12)" : "transparent",
                        border: `1px solid ${liked ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                        color: liked ? "#fff" : "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}>{"\u2665"}</button>
                      <button data-testid={`button-dislike-${fam.id}`} onClick={() => toggleNote(fam.id, "dislike")} style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: disliked ? "rgba(200,60,60,0.12)" : "transparent",
                        border: `1px solid ${disliked ? "rgba(200,60,60,0.28)" : "rgba(255,255,255,0.1)"}`,
                        color: disliked ? "rgba(200,80,80,0.8)" : "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}>{"\u2715"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {actualStep === 5 && (
          <div data-testid="quiz-step-identity" style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, marginBottom: "40px", lineHeight: 1.4 }}>
              A few more about you...
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
              {Object.entries(QUIZ_VIBES).map(([key, vibe]) => (
                <div key={key}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "16px", marginBottom: "14px", fontWeight: 300, lineHeight: 1.5 }}>
                    {vibe.question}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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
        padding: "24px", display: "flex", justifyContent: "center",
        background: "linear-gradient(transparent, #000 40%)",
      }}>
        <div style={{ width: "min(500px, 90vw)", display: "flex", gap: "12px" }}>
          {step > 0 && (
            <button data-testid="button-back" onClick={() => setStep(step - 1)} style={{
              padding: "16px 28px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
              color: "rgba(255,255,255,0.35)", fontSize: "13px", letterSpacing: "0.18em",
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
              flex: 1, padding: "16px",
              background: canProceed() ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${canProceed() ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "6px",
              color: canProceed() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
              fontSize: "13px", letterSpacing: "0.25em", textTransform: "uppercase",
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
