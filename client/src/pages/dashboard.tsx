import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser, clearUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ARCHETYPES, type ArchetypeId, type Fragrance, type VaultItem, type ToTryItem, WEAR_OCCASIONS, FAMILY_COLORS } from "@shared/schema";

type Tab = "home" | "vault" | "discover" | "to-try";

function useColors() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    isDark: d,
    bg: d ? "#000" : "#FFF8F5",
    fg: d ? "#fff" : "#1a1a1a",
    fgSoft: d ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    fgMuted: d ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
    fgDim: d ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    fgLabel: d ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
    fgStrong: d ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
    fgMid: d ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
    cardBg: d ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)",
    cardBgHover: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    borderColor: d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    borderSoft: d ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    borderHard: d ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
    inputBg: d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    overlayBg: d ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.5)",
    panelBg: d ? "#0a0a0a" : "#fff",
    chipActive: d ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    chipBorder: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    gold: "rgba(212,175,55,0.85)",
    goldDim: "rgba(212,175,55,0.5)",
    green: "rgba(180,220,180,0.85)",
    greenDim: "rgba(180,220,180,0.5)",
    shelfGlow: d ? "rgba(255,255,255,0.03)" : "rgba(180,160,140,0.08)",
    shelfBorder: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
  };
}

const PRIORITIES = [
  { value: "must-try", label: "Must Try" },
  { value: "curious", label: "Curious" },
  { value: "someday", label: "Someday" },
];

const BOTTLE_SHAPES = [
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <rect x="22" y="4" width="16" height="8" rx="2" fill={color} opacity="0.4" />
      <rect x="26" y="0" width="8" height="6" rx="1.5" fill={color} opacity="0.3" />
      <rect x="12" y="14" width="36" height="80" rx="6" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <clipPath id={`cp0-${uid}`}><rect x="12" y="14" width="36" height="80" rx="6" /></clipPath>
      <rect x="12" y={14 + 80 * (1 - fill / 100)} width="36" height={80 * fill / 100} clipPath={`url(#cp0-${uid})`} fill={color} opacity="0.35" />
      <rect x="16" y="18" width="4" height="30" rx="2" fill="white" opacity="0.08" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <rect x="24" y="2" width="12" height="10" rx="2" fill={color} opacity="0.4" />
      <rect x="27" y="0" width="6" height="4" rx="1" fill={color} opacity="0.3" />
      <ellipse cx="30" cy="58" rx="22" ry="36" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <clipPath id={`cp1-${uid}`}><ellipse cx="30" cy="58" rx="22" ry="36" /></clipPath>
      <rect x="8" y={58 + 36 - 72 * fill / 100} width="44" height={72 * fill / 100} clipPath={`url(#cp1-${uid})`} fill={color} opacity="0.35" />
      <ellipse cx="22" cy="42" rx="3" ry="12" fill="white" opacity="0.08" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <rect x="25" y="2" width="10" height="12" rx="2" fill={color} opacity="0.4" />
      <rect x="27" y="0" width="6" height="4" rx="1" fill={color} opacity="0.3" />
      <path d="M18 16 Q10 50 14 90 Q16 96 30 96 Q44 96 46 90 Q50 50 42 16 Z" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <clipPath id={`cp2-${uid}`}><path d="M18 16 Q10 50 14 90 Q16 96 30 96 Q44 96 46 90 Q50 50 42 16 Z" /></clipPath>
      <rect x="8" y={96 - 80 * fill / 100} width="44" height={80 * fill / 100} clipPath={`url(#cp2-${uid})`} fill={color} opacity="0.35" />
      <path d="M22 24 Q20 44 21 64" stroke="white" strokeWidth="2" fill="none" opacity="0.06" strokeLinecap="round" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <rect x="24" y="4" width="12" height="6" rx="1.5" fill={color} opacity="0.4" />
      <circle cx="30" cy="0" r="4" fill={color} opacity="0.25" />
      <rect x="16" y="12" width="28" height="82" rx="4" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <clipPath id={`cp3-${uid}`}><rect x="16" y="12" width="28" height="82" rx="4" /></clipPath>
      <rect x="16" y={12 + 82 * (1 - fill / 100)} width="28" height={82 * fill / 100} clipPath={`url(#cp3-${uid})`} fill={color} opacity="0.35" />
      <rect x="20" y="16" width="3" height="25" rx="1.5" fill="white" opacity="0.08" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <rect x="23" y="2" width="14" height="8" rx="3" fill={color} opacity="0.4" />
      <rect x="26" y="0" width="8" height="4" rx="2" fill={color} opacity="0.3" />
      <path d="M14 12 L14 80 Q14 96 30 96 Q46 96 46 80 L46 12 Q46 12 30 14 Q14 12 14 12 Z" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <clipPath id={`cp4-${uid}`}><path d="M14 12 L14 80 Q14 96 30 96 Q46 96 46 80 L46 12 Q46 12 30 14 Q14 12 14 12 Z" /></clipPath>
      <rect x="14" y={96 - 84 * fill / 100} width="32" height={84 * fill / 100} clipPath={`url(#cp4-${uid})`} fill={color} opacity="0.35" />
      <path d="M20 20 L20 50" stroke="white" strokeWidth="2" fill="none" opacity="0.06" strokeLinecap="round" />
    </svg>
  ),
];

function getBottleColor(family: string | null | undefined): string {
  if (!family) return "#9CA3AF";
  const key = family.charAt(0).toUpperCase() + family.slice(1).toLowerCase();
  return FAMILY_COLORS[key] || "#9CA3AF";
}

function NotePyramid({ fragrance, c }: { fragrance: Fragrance; c: ReturnType<typeof useColors> }) {
  const hasNotes = fragrance.topNotes?.length || fragrance.heartNotes?.length || fragrance.baseNotes?.length;
  if (!hasNotes) return null;

  const tierStyle = { display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "10px" };
  const labelStyle = { fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" as const, color: c.fgDim, marginBottom: "6px" };
  const noteChip = { padding: "3px 10px", background: c.inputBg, borderRadius: "20px", fontSize: "12px", color: c.fgSoft, lineHeight: 1.6 };

  return (
    <div style={{ marginTop: "16px" }}>
      {fragrance.topNotes?.length ? (
        <div><p style={labelStyle}>Top</p><div style={tierStyle}>{fragrance.topNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div>
      ) : null}
      {fragrance.heartNotes?.length ? (
        <div><p style={labelStyle}>Heart</p><div style={tierStyle}>{fragrance.heartNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div>
      ) : null}
      {fragrance.baseNotes?.length ? (
        <div><p style={labelStyle}>Base</p><div style={tierStyle}>{fragrance.baseNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div>
      ) : null}
    </div>
  );
}

function StarRating({ value, onChange, c }: { value: number; onChange: (v: number) => void; c: ReturnType<typeof useColors> }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} data-testid={`button-star-${star}`} onClick={() => onChange(star === value ? 0 : star)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: star <= value ? c.gold : c.fgMuted, padding: "2px", transition: "color 0.2s ease" }}>
          {star <= value ? "\u2605" : "\u2606"}
        </button>
      ))}
    </div>
  );
}

function FragranceDetailPanel({
  fragrance, matchScore, onClose, onAddVault, onAddTry, inVault, inTry, onLogWear, c,
}: {
  fragrance: Fragrance; matchScore?: number; onClose: () => void; onAddVault: () => void;
  onAddTry: (priority: string) => void; inVault: boolean; inTry: boolean; onLogWear?: () => void; c: ReturnType<typeof useColors>;
}) {
  return (
    <div data-testid="fragrance-detail-overlay" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: c.overlayBg, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div data-testid="fragrance-detail-panel" onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", maxHeight: "85vh", background: c.panelBg, borderRadius: "12px", padding: "32px 28px", overflow: "auto", border: `1px solid ${c.borderColor}`, fontFamily: "'Cormorant', Georgia, serif", color: c.fg, animation: "slideUp 0.35s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div style={{ flex: 1 }}>
            <h2 data-testid="text-detail-name" style={{ fontSize: "24px", fontWeight: 400, margin: "0 0 4px", lineHeight: 1.3 }}>{fragrance.name}</h2>
            <p style={{ color: c.fgLabel, fontSize: "15px", margin: "0 0 2px" }}>{fragrance.house}</p>
            {fragrance.concentration && <p style={{ color: c.fgDim, fontSize: "13px", margin: 0 }}>{fragrance.concentration}</p>}
          </div>
          <button data-testid="button-close-detail" onClick={onClose} style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "22px", cursor: "pointer", padding: "4px 8px", marginTop: "-4px" }}>{"\u00D7"}</button>
        </div>
        {matchScore !== undefined && (
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "6px", marginTop: "12px", marginBottom: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: 300, color: matchScore >= 70 ? c.green : matchScore >= 50 ? c.fgSoft : c.fgDim }}>{matchScore}%</span>
            <span style={{ fontSize: "12px", color: c.fgDim, letterSpacing: "0.15em", textTransform: "uppercase" }}>match</span>
          </div>
        )}
        {fragrance.family && (
          <div style={{ marginTop: "16px" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", fontSize: "11px", background: c.inputBg, borderRadius: "20px", color: c.fgLabel, letterSpacing: "0.15em", textTransform: "uppercase" }}>{fragrance.family}</span>
          </div>
        )}
        {fragrance.description && <p style={{ color: c.fgSoft, fontSize: "15px", lineHeight: 1.75, marginTop: "20px", marginBottom: "0" }}>{fragrance.description}</p>}
        <NotePyramid fragrance={fragrance} c={c} />
        {!inVault && !inTry && (
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${c.borderSoft}` }}>
            <button data-testid="button-detail-add-vault" onClick={onAddVault}
              style={{ flex: 1, padding: "12px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "4px", color: c.fgMid, fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>Add to Vault</button>
            <button data-testid="button-detail-add-try" onClick={() => onAddTry("curious")}
              style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${c.borderColor}`, borderRadius: "4px", color: c.fgSoft, fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>Add to Try</button>
          </div>
        )}
        {inVault && (
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", alignItems: "center" }}>
            <p style={{ fontSize: "12px", color: c.greenDim, letterSpacing: "0.15em", textTransform: "uppercase" }}>In your vault</p>
            {onLogWear && <button data-testid="button-detail-log-wear" onClick={onLogWear} style={{ marginLeft: "auto", padding: "6px 14px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "4px", color: c.fgMid, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>Log Wear</button>}
          </div>
        )}
        {inTry && !inVault && <p style={{ marginTop: "20px", fontSize: "12px", color: c.goldDim, letterSpacing: "0.15em", textTransform: "uppercase" }}>On your to-try list</p>}
      </div>
    </div>
  );
}

function VaultEditPanel({ item, fragrance, onClose, onSave, c }: {
  item: VaultItem; fragrance: Fragrance; onClose: () => void; onSave: (updates: any) => void; c: ReturnType<typeof useColors>;
}) {
  const [rating, setRating] = useState(item.rating || 0);
  const [notes, setNotes] = useState(item.notes || "");
  const [bottleSize, setBottleSize] = useState(item.bottleSize || "");
  const [fillLevel, setFillLevel] = useState(item.fillLevel || 100);
  const [wearFrequency, setWearFrequency] = useState(item.wearFrequency || "");

  const inputStyle = { width: "100%", padding: "10px 14px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "4px", color: c.fg, fontSize: "14px", fontFamily: "'Cormorant', Georgia, serif", outline: "none", boxSizing: "border-box" as const };

  return (
    <div data-testid="vault-edit-overlay" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: c.overlayBg, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div data-testid="vault-edit-panel" onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", maxHeight: "85vh", background: c.panelBg, borderRadius: "12px", padding: "32px 28px", overflow: "auto", border: `1px solid ${c.borderColor}`, fontFamily: "'Cormorant', Georgia, serif", color: c.fg, animation: "slideUp 0.35s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 4px" }}>{fragrance.name}</h2>
            <p style={{ color: c.fgLabel, fontSize: "14px", margin: 0 }}>{fragrance.house}</p>
          </div>
          <button data-testid="button-close-edit" onClick={onClose} style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "22px", cursor: "pointer" }}>{"\u00D7"}</button>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Your Rating</p>
          <StarRating value={rating} onChange={setRating} c={c} />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Personal Notes</p>
          <textarea data-testid="input-vault-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How does this one make you feel?" rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Bottle Size</p>
            <select data-testid="select-bottle-size" value={bottleSize} onChange={e => setBottleSize(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Select</option>
              <option value="2ml">2ml Sample</option>
              <option value="5ml">5ml Decant</option>
              <option value="10ml">10ml Travel</option>
              <option value="30ml">30ml</option>
              <option value="50ml">50ml</option>
              <option value="75ml">75ml</option>
              <option value="100ml">100ml</option>
            </select>
          </div>
          <div>
            <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Fill Level</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input data-testid="input-fill-level" type="range" min={0} max={100} value={fillLevel} onChange={e => setFillLevel(parseInt(e.target.value))} style={{ flex: 1, accentColor: c.fgLabel }} />
              <span style={{ fontSize: "13px", color: c.fgSoft, minWidth: "36px", textAlign: "right" }}>{fillLevel}%</span>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Wear Frequency</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["Daily", "Weekly", "Occasion", "Seasonal", "Rarely"].map(freq => (
              <button key={freq} data-testid={`button-freq-${freq.toLowerCase()}`} onClick={() => setWearFrequency(wearFrequency === freq ? "" : freq)}
                style={{ padding: "7px 16px", background: wearFrequency === freq ? c.chipActive : c.cardBg, border: `1px solid ${wearFrequency === freq ? c.borderHard : c.chipBorder}`, borderRadius: "20px", color: wearFrequency === freq ? c.fgMid : c.fgDim, fontSize: "12px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", transition: "all 0.2s ease" }}>
                {freq}
              </button>
            ))}
          </div>
        </div>
        <button data-testid="button-save-vault-edit" onClick={() => onSave({ rating: rating || null, notes: notes || null, bottleSize: bottleSize || null, fillLevel, wearFrequency: wearFrequency || null })}
          style={{ width: "100%", padding: "14px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "4px", color: c.fgMid, fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", transition: "all 0.2s ease" }}>Save</button>
      </div>
    </div>
  );
}

function WearLogModal({ fragranceId, fragranceName, onClose, onSubmit, isPending, c }: {
  fragranceId: string; fragranceName: string; onClose: () => void;
  onSubmit: (data: { fragranceId: string; occasion?: string; notes?: string }) => void;
  isPending: boolean; c: ReturnType<typeof useColors>;
}) {
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div data-testid="wear-log-overlay" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: c.overlayBg, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div data-testid="wear-log-panel" onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "420px", background: c.panelBg, borderRadius: "12px", padding: "32px 28px", border: `1px solid ${c.borderColor}`, fontFamily: "'Cormorant', Georgia, serif", color: c.fg, animation: "slideUp 0.35s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: c.fgDim, margin: "0 0 6px" }}>Log a Wear</p>
            <h3 style={{ fontSize: "20px", fontWeight: 400, margin: 0 }}>{fragranceName}</h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "22px", cursor: "pointer" }}>{"\u00D7"}</button>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Occasion</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {WEAR_OCCASIONS.map(occ => (
              <button key={occ} data-testid={`button-occasion-${occ.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => setOccasion(occasion === occ ? "" : occ)}
                style={{ padding: "7px 16px", background: occasion === occ ? c.chipActive : c.cardBg, border: `1px solid ${occasion === occ ? c.borderHard : c.chipBorder}`, borderRadius: "20px", color: occasion === occ ? c.fgMid : c.fgDim, fontSize: "12px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", transition: "all 0.2s ease" }}>
                {occ}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "10px" }}>Notes (optional)</p>
          <textarea data-testid="input-wear-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it wear today?" rows={2}
            style={{ width: "100%", padding: "10px 14px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "4px", color: c.fg, fontSize: "14px", fontFamily: "'Cormorant', Georgia, serif", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
        </div>
        <button data-testid="button-submit-wear" disabled={isPending}
          onClick={() => onSubmit({ fragranceId, occasion: occasion || undefined, notes: notes || undefined })}
          style={{ width: "100%", padding: "14px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "4px", color: c.fgMid, fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: isPending ? "wait" : "pointer", fontFamily: "'Cormorant', Georgia, serif", opacity: isPending ? 0.5 : 1 }}>
          {isPending ? "Logging..." : "Log Wear"}
        </button>
      </div>
    </div>
  );
}

function GlassShelfVault({ items, onEdit, onDetail, onRemove, onAdd, onLogWear, c }: {
  items: (VaultItem & { fragrance: Fragrance })[];
  onEdit: (item: VaultItem & { fragrance: Fragrance }) => void;
  onDetail: (frag: Fragrance) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onLogWear: (fragranceId: string) => void;
  c: ReturnType<typeof useColors>;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const maxSlots = Math.max(items.length + 1, 4);
  const shelvesNeeded = Math.ceil(maxSlots / 4);

  const allSlots: (typeof items[0] | null)[] = [];
  for (let s = 0; s < shelvesNeeded; s++) {
    for (let i = 0; i < 4; i++) {
      const idx = s * 4 + i;
      allSlots.push(idx < items.length ? items[idx] : null);
    }
  }

  return (
    <div data-testid="tab-content-vault" style={{ animation: "fadeUp 0.5s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, margin: "0 0 6px" }}>My Vault</p>
          <p style={{ color: c.fgMuted, fontSize: "13px", margin: 0 }}>{items.length} {items.length === 1 ? "fragrance" : "fragrances"}</p>
        </div>
        <button data-testid="button-add-to-vault" onClick={onAdd}
          style={{ padding: "8px 18px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "4px", color: c.fgMid, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>+ Add</button>
      </div>

      {Array.from({ length: shelvesNeeded }).map((_, shelfIdx) => {
        const shelfItems = allSlots.slice(shelfIdx * 4, shelfIdx * 4 + 4);
        return (
          <div key={shelfIdx} style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", padding: "20px 8px 28px", position: "relative" }}>
              {shelfItems.map((slot, i) => {
                const globalIdx = shelfIdx * 4 + i;
                if (!slot) {
                  if (globalIdx === items.length) {
                    return (
                      <div key={`empty-${globalIdx}`} data-testid="button-vault-add-slot"
                        onClick={onAdd}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "120px", cursor: "pointer", borderRadius: "8px", border: `1px dashed ${c.borderColor}`, transition: "border-color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = c.borderHard)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = c.borderColor)}>
                        <span style={{ fontSize: "28px", color: c.fgMuted, lineHeight: 1 }}>+</span>
                        <span style={{ fontSize: "10px", color: c.fgMuted, letterSpacing: "0.1em", marginTop: "6px" }}>ADD</span>
                      </div>
                    );
                  }
                  return <div key={`empty-${globalIdx}`} style={{ minHeight: "120px" }} />;
                }
                const item = slot;
                const bottleColor = getBottleColor(item.fragrance?.family);
                const shapeIdx = globalIdx % BOTTLE_SHAPES.length;
                const isHovered = hoveredId === item.id;
                return (
                  <div key={item.id} data-testid={`card-vault-${item.id}`}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onEdit(item)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                      minHeight: "120px", cursor: "pointer", position: "relative",
                      transform: isHovered ? "translateY(-8px)" : "translateY(0)",
                      transition: "transform 0.3s cubic-bezier(0.25,0.1,0.25,1)",
                    }}>
                    <div style={{ filter: isHovered ? `drop-shadow(0 4px 12px ${bottleColor}40)` : "none", transition: "filter 0.3s ease" }}>
                      {BOTTLE_SHAPES[shapeIdx](bottleColor, item.fillLevel ?? 100, item.id)}
                    </div>
                    {isHovered && (
                      <div style={{
                        position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                        background: c.panelBg, border: `1px solid ${c.borderColor}`, borderRadius: "8px",
                        padding: "10px 14px", whiteSpace: "nowrap", zIndex: 10,
                        boxShadow: c.isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
                        animation: "fadeUp 0.2s ease-out", minWidth: "120px", textAlign: "center",
                      }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 3px", color: c.fg }}>{item.fragrance?.name}</p>
                        <p style={{ fontSize: "11px", color: c.fgLabel, margin: "0 0 6px" }}>{item.fragrance?.house}</p>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                          {item.fillLevel !== null && item.fillLevel !== undefined && (
                            <span style={{ fontSize: "10px", color: c.fgDim }}>{item.fillLevel}% full</span>
                          )}
                          {item.matchScore ? <span style={{ fontSize: "10px", color: c.greenDim }}>{Math.round(item.matchScore)}% match</span> : null}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button data-testid={`button-vault-wear-${item.id}`}
                            onClick={e => { e.stopPropagation(); onLogWear(item.fragranceId); }}
                            style={{ padding: "3px 10px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "12px", fontSize: "10px", color: c.fgMid, cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", letterSpacing: "0.08em" }}>
                            Log Wear
                          </button>
                          <button data-testid={`button-details-vault-${item.id}`}
                            onClick={e => { e.stopPropagation(); if (item.fragrance) onDetail(item.fragrance); }}
                            style={{ padding: "3px 10px", background: "transparent", border: `1px solid ${c.chipBorder}`, borderRadius: "12px", fontSize: "10px", color: c.fgDim, cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", letterSpacing: "0.08em" }}>
                            Details
                          </button>
                          <button data-testid={`button-remove-vault-${item.id}`}
                            onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                            style={{ padding: "3px 10px", background: "transparent", border: `1px solid ${c.chipBorder}`, borderRadius: "12px", fontSize: "10px", color: "rgba(200,80,80,0.5)", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", letterSpacing: "0.08em" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: "11px", color: c.fgLabel, margin: "6px 0 0", textAlign: "center", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.fragrance?.name}
                    </p>
                    {item.rating ? (
                      <span style={{ fontSize: "10px", color: c.goldDim }}>{"\u2605".repeat(item.rating)}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div style={{
              height: "3px",
              background: `linear-gradient(90deg, transparent 0%, ${c.shelfGlow} 20%, ${c.shelfGlow} 80%, transparent 100%)`,
              borderRadius: "2px",
              boxShadow: c.isDark ? `0 2px 16px ${c.shelfGlow}, 0 0 40px ${c.shelfGlow}` : `0 1px 8px ${c.shelfGlow}`,
              borderTop: `1px solid ${c.shelfBorder}`,
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailFragrance, setDetailFragrance] = useState<(Fragrance & { matchScore?: number }) | null>(null);
  const [editingVaultItem, setEditingVaultItem] = useState<(VaultItem & { fragrance: Fragrance }) | null>(null);
  const [wearLogFragId, setWearLogFragId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const user = getStoredUser();
  const c = useColors();

  useEffect(() => {
    if (!user) setLocation("/access");
    else if (!user.onboardingComplete) setLocation("/quiz");
  }, [user, setLocation]);

  if (!user) return null;

  const archetype = user.archetypeId ? ARCHETYPES[user.archetypeId as ArchetypeId] : null;

  const { data: recommendations = [] } = useQuery<(Fragrance & { matchScore: number })[]>({
    queryKey: ["/api/users", user.id, "recommendations"],
    queryFn: async () => { const res = await fetch(`/api/users/${user.id}/recommendations`); return res.json(); },
  });

  const { data: vaultItems = [] } = useQuery<(VaultItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", user.id, "vault"],
    queryFn: async () => { const res = await fetch(`/api/users/${user.id}/vault`); return res.json(); },
  });

  const { data: toTryItems = [] } = useQuery<(ToTryItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", user.id, "to-try"],
    queryFn: async () => { const res = await fetch(`/api/users/${user.id}/to-try`); return res.json(); },
  });

  const { data: searchResults = [] } = useQuery<Fragrance[]>({
    queryKey: ["/api/fragrances", searchQuery],
    queryFn: async () => { if (!searchQuery.trim()) return []; const res = await fetch(`/api/fragrances?search=${encodeURIComponent(searchQuery)}`); return res.json(); },
    enabled: searchQuery.trim().length > 1,
  });

  const addToVault = useMutation({
    mutationFn: async (fragranceId: string) => { const res = await apiRequest("POST", `/api/users/${user.id}/vault`, { fragranceId }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] }); setShowAddModal(false); setDetailFragrance(null); setSearchQuery(""); },
  });

  const addToTry = useMutation({
    mutationFn: async ({ fragranceId, priority }: { fragranceId: string; priority: string }) => { const res = await apiRequest("POST", `/api/users/${user.id}/to-try`, { fragranceId, priority }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] }); queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] }); setDetailFragrance(null); },
  });

  const removeFromVault = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/vault/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] }); },
  });

  const removeFromToTry = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/to-try/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] }); },
  });

  const updateVaultItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => { const res = await apiRequest("PATCH", `/api/vault/${id}`, updates); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); setEditingVaultItem(null); },
  });

  const updateToTryPriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => { const res = await apiRequest("PATCH", `/api/to-try/${id}`, { priority }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] }); },
  });

  const logWear = useMutation({
    mutationFn: async ({ fragranceId, occasion, notes }: { fragranceId: string; occasion?: string; notes?: string }) => { const res = await apiRequest("POST", `/api/users/${user.id}/wear-logs`, { fragranceId, occasion, notes }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "wear-logs"] }); queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); setWearLogFragId(null); },
  });

  const handleLogout = () => { clearUser(); setLocation("/"); };

  const vaultFragIds = new Set(vaultItems.map(v => v.fragranceId));
  const toTryFragIds = new Set(toTryItems.map(t => t.fragranceId));

  const tabStyle = (t: Tab) => ({
    padding: "12px 0",
    background: "transparent",
    border: "none",
    borderBottom: activeTab === t ? `2px solid ${c.fgSoft}` : "2px solid transparent",
    color: activeTab === t ? c.fgStrong : c.fgDim,
    fontSize: "13px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.3s ease",
    flex: 1,
    fontWeight: activeTab === t ? 500 : 400,
  });

  const sectionLabel = { fontSize: "13px", fontWeight: 400 as const, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: c.fgLabel, margin: "0 0 20px" };
  const cardBase = { background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "8px", padding: "20px", transition: "border-color 0.3s ease", cursor: "pointer" };
  const actionBtn = (filled = false) => ({
    padding: "8px 18px",
    background: filled ? c.chipActive : "transparent",
    border: `1px solid ${filled ? c.borderColor : c.chipBorder}`,
    borderRadius: "4px",
    color: filled ? c.fgMid : c.fgDim,
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.2s ease",
  });

  const wearLogFragName = wearLogFragId ? (vaultItems.find(v => v.fragranceId === wearLogFragId)?.fragrance?.name || recommendations.find(r => r.id === wearLogFragId)?.name || "Fragrance") : "";

  return (
    <div data-testid="dashboard-page" style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Cormorant', Georgia, serif", color: c.fg, paddingBottom: "100px" }}>
      <header style={{ padding: "20px clamp(20px, 5vw, 40px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${c.borderSoft}` }}>
        <h1 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "28px", fontWeight: 400, margin: 0 }}>Sillage</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button data-testid="button-nav-feed" onClick={() => setLocation("/feed")}
            style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "12px", cursor: "pointer", letterSpacing: "0.12em", fontFamily: "'Cormorant', Georgia, serif", textTransform: "uppercase", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = c.fgSoft} onMouseLeave={e => e.currentTarget.style.color = c.fgDim}>
            Feed
          </button>
          <button data-testid="button-nav-profile" onClick={() => setLocation("/profile")}
            style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "12px", cursor: "pointer", letterSpacing: "0.12em", fontFamily: "'Cormorant', Georgia, serif", textTransform: "uppercase", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = c.fgSoft} onMouseLeave={e => e.currentTarget.style.color = c.fgDim}>
            Profile
          </button>
          <span style={{ color: c.fgLabel, fontSize: "14px" }}>{user.displayName || user.username}</span>
          <button data-testid="button-logout" onClick={handleLogout} style={{ background: "transparent", border: "none", color: c.fgMuted, fontSize: "12px", cursor: "pointer", letterSpacing: "0.1em", fontFamily: "'Cormorant', Georgia, serif" }}>
            Sign Out
          </button>
        </div>
      </header>

      <nav style={{ display: "flex", padding: "0 clamp(20px, 5vw, 40px)", borderBottom: `1px solid ${c.borderSoft}`, gap: "4px" }}>
        {(["home", "vault", "discover", "to-try"] as Tab[]).map(t => (
          <button key={t} data-testid={`tab-${t}`} onClick={() => { setActiveTab(t); setSearchQuery(""); }} style={tabStyle(t)}>
            {t === "to-try" ? "To Try" : t}
          </button>
        ))}
      </nav>

      <main style={{ padding: "32px clamp(20px, 5vw, 40px)", maxWidth: "720px", margin: "0 auto" }}>
        {activeTab === "home" && (
          <div data-testid="tab-content-home" style={{ animation: "fadeUp 0.5s ease-out" }}>
            {archetype && (
              <div style={{ ...cardBase, cursor: "default", marginBottom: "32px", textAlign: "center", padding: "36px 24px", background: `linear-gradient(135deg, ${c.cardBg}, ${archetype.color}08)`, borderColor: `${archetype.color}15` }}>
                <p style={{ color: c.fgDim, fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "12px" }}>Your Sillage</p>
                <h2 data-testid="text-user-archetype" style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "clamp(32px, 7vw, 48px)", fontWeight: 400, margin: "0 0 10px", textShadow: `0 0 50px ${archetype.color}25` }}>{archetype.name}</h2>
                <p style={{ color: c.fgLabel, fontSize: "15px", fontStyle: "italic", margin: "0 0 16px" }}>{archetype.tagline}</p>
                <p style={{ color: c.fgDim, fontSize: "14px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.7 }}>{archetype.description}</p>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <p style={sectionLabel}>Recommended for You</p>
            </div>
            <p style={{ color: c.fgMuted, fontSize: "13px", marginBottom: "20px", lineHeight: 1.6 }}>Fragrances scored for your taste profile</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recommendations.slice(0, 6).map(frag => (
                <div key={frag.id} data-testid={`card-recommendation-${frag.id}`} onClick={() => setDetailFragrance(frag)} style={cardBase}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400, lineHeight: 1.3 }}>{frag.name}</p>
                      <p style={{ color: c.fgLabel, fontSize: "14px", margin: "0 0 8px" }}>
                        {frag.house}
                        {frag.concentration && <span style={{ color: c.fgMuted }}> {"\u00B7"} {frag.concentration}</span>}
                      </p>
                      <p style={{ color: c.fgDim, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                        {frag.description?.slice(0, 100)}{(frag.description?.length || 0) > 100 ? "..." : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, paddingTop: "2px" }}>
                      <span data-testid={`text-match-score-${frag.id}`} style={{ fontSize: "24px", fontWeight: 300, color: frag.matchScore >= 70 ? c.green : frag.matchScore >= 50 ? c.fgSoft : c.fgDim }}>{frag.matchScore}%</span>
                      <p style={{ color: c.fgMuted, fontSize: "10px", margin: "3px 0 0", letterSpacing: "0.15em", textTransform: "uppercase" }}>match</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {!vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-add-vault-${frag.id}`} onClick={e => { e.stopPropagation(); addToVault.mutate(frag.id); }} style={actionBtn(true)}>+ Vault</button>
                    )}
                    {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-add-try-${frag.id}`} onClick={e => { e.stopPropagation(); addToTry.mutate({ fragranceId: frag.id, priority: "curious" }); }} style={actionBtn()}>+ To Try</button>
                    )}
                    {(vaultFragIds.has(frag.id) || toTryFragIds.has(frag.id)) && (
                      <span style={{ fontSize: "11px", color: c.fgMuted, letterSpacing: "0.15em", textTransform: "uppercase", alignSelf: "center" }}>
                        {vaultFragIds.has(frag.id) ? "In vault" : "On to-try list"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "vault" && (
          <GlassShelfVault
            items={vaultItems}
            onEdit={setEditingVaultItem}
            onDetail={setDetailFragrance}
            onRemove={(id) => removeFromVault.mutate(id)}
            onAdd={() => setShowAddModal(true)}
            onLogWear={(fid) => setWearLogFragId(fid)}
            c={c}
          />
        )}

        {activeTab === "discover" && (
          <div data-testid="tab-content-discover" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <p style={{ ...sectionLabel, marginBottom: "16px" }}>Discover</p>
            <div style={{ marginBottom: "24px" }}>
              <input data-testid="input-search-fragrances" type="text" placeholder="Search by name, house, or family..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "14px 18px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "6px", color: c.fg, fontSize: "15px", fontFamily: "'Cormorant', Georgia, serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease" }}
                onFocus={e => e.target.style.borderColor = c.borderHard} onBlur={e => e.target.style.borderColor = c.borderColor} />
            </div>
            {!searchQuery.trim() && <p style={{ color: c.fgMuted, fontSize: "13px", marginBottom: "20px" }}>Showing your top matches. Search to find specific fragrances.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(searchQuery.trim() ? searchResults : recommendations).map(frag => (
                <div key={frag.id} data-testid={`card-discover-${frag.id}`} onClick={() => setDetailFragrance(frag as any)} style={cardBase}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400 }}>{frag.name}</p>
                      <p style={{ color: c.fgLabel, fontSize: "14px", margin: "0 0 6px" }}>
                        {frag.house}
                        {frag.concentration && <span style={{ color: c.fgMuted }}> {"\u00B7"} {frag.concentration}</span>}
                      </p>
                      {frag.family && (
                        <span style={{ display: "inline-block", padding: "3px 10px", fontSize: "10px", background: c.inputBg, borderRadius: "20px", color: c.fgDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>{frag.family}</span>
                      )}
                      <p style={{ color: c.fgDim, fontSize: "13px", margin: "4px 0 0", lineHeight: 1.6 }}>
                        {frag.description?.slice(0, 120)}{(frag.description?.length || 0) > 120 ? "..." : ""}
                      </p>
                    </div>
                    {"matchScore" in frag && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: "22px", fontWeight: 300, color: (frag as any).matchScore >= 70 ? c.green : c.fgSoft }}>{(frag as any).matchScore}%</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {!vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-vault-${frag.id}`} onClick={e => { e.stopPropagation(); addToVault.mutate(frag.id); }} disabled={addToVault.isPending} style={actionBtn(true)}>+ Vault</button>
                    )}
                    {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-try-${frag.id}`} onClick={e => { e.stopPropagation(); addToTry.mutate({ fragranceId: frag.id, priority: "curious" }); }} disabled={addToTry.isPending} style={actionBtn()}>+ To Try</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "to-try" && (
          <div data-testid="tab-content-to-try" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <p style={sectionLabel}>To Try {"\u00B7"} {toTryItems.length}</p>
            {toTryItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <p style={{ color: c.fgDim, fontSize: "16px", marginBottom: "10px", lineHeight: 1.5 }}>Nothing on your list yet</p>
                <p style={{ color: c.fgMuted, fontSize: "14px", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto" }}>Browse your recommendations and add fragrances you want to sample.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {toTryItems.map(item => (
                  <div key={item.id} data-testid={`card-try-${item.id}`} onClick={() => item.fragrance && setDetailFragrance({ ...item.fragrance, matchScore: item.matchScore ?? undefined } as any)} style={cardBase}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400 }}>{item.fragrance?.name}</p>
                        <p style={{ color: c.fgLabel, fontSize: "14px", margin: "0 0 8px" }}>{item.fragrance?.house}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                          {item.matchScore ? <span style={{ fontSize: "12px", color: c.greenDim }}>{Math.round(item.matchScore)}% match</span> : null}
                          <div style={{ display: "flex", gap: "4px" }}>
                            {PRIORITIES.map(p => (
                              <button key={p.value} data-testid={`button-priority-${p.value}-${item.id}`}
                                onClick={e => { e.stopPropagation(); updateToTryPriority.mutate({ id: item.id, priority: p.value }); }}
                                style={{ padding: "3px 10px", background: item.priority === p.value ? c.chipActive : "transparent", border: `1px solid ${item.priority === p.value ? c.borderHard : c.chipBorder}`, borderRadius: "20px", color: item.priority === p.value ? c.fgMid : c.fgMuted, fontSize: "10px", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", textTransform: "uppercase", transition: "all 0.2s ease" }}>
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                        {!vaultFragIds.has(item.fragranceId) && (
                          <button data-testid={`button-try-to-vault-${item.id}`} onClick={e => { e.stopPropagation(); addToVault.mutate(item.fragranceId); removeFromToTry.mutate(item.id); }} style={actionBtn(true)}>Own it</button>
                        )}
                        <button data-testid={`button-remove-try-${item.id}`} onClick={e => { e.stopPropagation(); removeFromToTry.mutate(item.id); }}
                          style={{ background: "transparent", border: "none", color: c.fgMuted, fontSize: "18px", cursor: "pointer", padding: "4px" }}>{"\u00D7"}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <div data-testid="add-modal-overlay" onClick={() => { setShowAddModal(false); setSearchQuery(""); }}
          style={{ position: "fixed", inset: 0, background: c.overlayBg, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", maxHeight: "75vh", background: c.panelBg, borderRadius: "16px 16px 0 0", padding: "28px", overflow: "auto", border: `1px solid ${c.borderColor}`, borderBottom: "none", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgSoft, margin: 0 }}>Add to Vault</h3>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(""); }} style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "22px", cursor: "pointer" }}>{"\u00D7"}</button>
            </div>
            <input data-testid="input-modal-search" type="text" placeholder="Search fragrances..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              style={{ width: "100%", padding: "14px 18px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "6px", color: c.fg, fontSize: "15px", fontFamily: "'Cormorant', Georgia, serif", outline: "none", boxSizing: "border-box", marginBottom: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {searchResults.filter(f => !vaultFragIds.has(f.id)).map(frag => (
                <div key={frag.id} data-testid={`card-modal-frag-${frag.id}`} onClick={() => addToVault.mutate(frag.id)}
                  style={{ ...cardBase, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "16px", margin: "0 0 3px" }}>{frag.name}</p>
                    <p style={{ color: c.fgDim, fontSize: "13px", margin: 0 }}>{frag.house}</p>
                  </div>
                  <span style={{ color: c.fgMuted, fontSize: "20px" }}>+</span>
                </div>
              ))}
              {searchQuery.trim().length > 1 && searchResults.filter(f => !vaultFragIds.has(f.id)).length === 0 && (
                <p style={{ color: c.fgMuted, fontSize: "14px", textAlign: "center", padding: "24px" }}>No results found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {detailFragrance && (
        <FragranceDetailPanel
          fragrance={detailFragrance}
          matchScore={(detailFragrance as any).matchScore}
          onClose={() => setDetailFragrance(null)}
          onAddVault={() => addToVault.mutate(detailFragrance.id)}
          onAddTry={(priority) => addToTry.mutate({ fragranceId: detailFragrance.id, priority })}
          inVault={vaultFragIds.has(detailFragrance.id)}
          inTry={toTryFragIds.has(detailFragrance.id)}
          onLogWear={vaultFragIds.has(detailFragrance.id) ? () => { setWearLogFragId(detailFragrance.id); setDetailFragrance(null); } : undefined}
          c={c}
        />
      )}

      {editingVaultItem && (
        <VaultEditPanel
          item={editingVaultItem}
          fragrance={editingVaultItem.fragrance}
          onClose={() => setEditingVaultItem(null)}
          onSave={(updates) => updateVaultItem.mutate({ id: editingVaultItem.id, updates })}
          c={c}
        />
      )}

      {wearLogFragId && (
        <WearLogModal
          fragranceId={wearLogFragId}
          fragranceName={wearLogFragName}
          onClose={() => setWearLogFragId(null)}
          onSubmit={(data) => logWear.mutate(data)}
          isPending={logWear.isPending}
          c={c}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; background: ${c.bg} !important; }
        input::placeholder, textarea::placeholder { color: ${c.fgMuted}; }
        ::-webkit-scrollbar { width: 0; background: transparent; }
        * { scrollbar-width: none; }
        select option { background: ${c.panelBg}; color: ${c.fg}; }
      `}</style>
    </div>
  );
}
