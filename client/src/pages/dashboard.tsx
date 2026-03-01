import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser, clearUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ARCHETYPES, type ArchetypeId, type Fragrance, type VaultItem, type ToTryItem, WEAR_OCCASIONS, FAMILY_COLORS } from "@shared/schema";

type MainTab = "home" | "explore" | "profile";
type HomeSubTab = "vault" | "log" | "totry";
type ExploreSubTab = "feed" | "exchange";

interface FeedPostData {
  id: string; userId: string; type: string; content: string | null;
  fragranceId: string | null; rating: number | null; likeCount: number; createdAt: string;
  user: { id: string; username: string; displayName: string | null; archetypeId: string | null } | null;
  fragrance: Fragrance | null; liked: boolean;
}

interface WearLogData {
  id: string; userId: string; fragranceId: string; occasion: string | null;
  notes: string | null; wornAt: string;
  fragrance?: Fragrance | null;
}

function useColors() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    isDark: d, bg: d ? "#000" : "#eddfd9", fg: d ? "#fff" : "#1a1a1a",
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
    gold: "rgba(212,184,160,0.9)", goldDim: "rgba(212,184,160,0.5)",
    green: "rgba(196,168,144,0.85)", greenDim: "rgba(196,168,144,0.6)",
    violet: "rgba(201,184,168,1)", violetDim: "rgba(201,184,168,0.4)",
    shelfGlow: d ? "rgba(212,184,160,0.08)" : "rgba(180,160,140,0.12)",
    shelfBorder: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
  };
}

const BOTTLE_SHAPES = [
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <defs>
        <linearGradient id={`shine0-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.15" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        <clipPath id={`cp0-${uid}`}><rect x="12" y="14" width="36" height="80" rx="6" /></clipPath>
      </defs>
      <rect x="22" y="4" width="16" height="8" rx="2" fill="#c9b8a8" opacity="0.5" />
      <rect x="26" y="0" width="8" height="6" rx="1.5" fill="#c9b8a8" opacity="0.4" />
      <rect x="12" y="14" width="36" height="80" rx="6" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="12" y={14 + 80 * (1 - fill / 100)} width="36" height={80 * fill / 100} clipPath={`url(#cp0-${uid})`} fill={color} opacity="0.4" />
      <rect x="12" y="14" width="36" height="80" rx="6" fill={`url(#shine0-${uid})`} />
      <line x1="18" y1="20" x2="22" y2="70" stroke="white" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
      <text x="30" y="60" textAnchor="middle" fontSize="5" fill="white" opacity="0.3" fontFamily="serif" letterSpacing="0.5"></text>
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <defs>
        <linearGradient id={`shine1-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.12" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        <clipPath id={`cp1-${uid}`}><ellipse cx="30" cy="58" rx="22" ry="36" /></clipPath>
      </defs>
      <rect x="24" y="2" width="12" height="10" rx="2" fill="silver" opacity="0.5" />
      <rect x="27" y="0" width="6" height="4" rx="1" fill="silver" opacity="0.4" />
      <ellipse cx="30" cy="58" rx="22" ry="36" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="8" y={58 + 36 - 72 * fill / 100} width="44" height={72 * fill / 100} clipPath={`url(#cp1-${uid})`} fill={color} opacity="0.4" />
      <ellipse cx="30" cy="58" rx="22" ry="36" fill={`url(#shine1-${uid})`} />
      <ellipse cx="22" cy="42" rx="3" ry="12" fill="white" opacity="0.06" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 60 100" width="60" height="100">
      <defs>
        <linearGradient id={`shine2-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.12" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        <clipPath id={`cp2-${uid}`}><path d="M18 16 Q10 50 14 90 Q16 96 30 96 Q44 96 46 90 Q50 50 42 16 Z" /></clipPath>
      </defs>
      <rect x="25" y="2" width="10" height="12" rx="2" fill="#c9b8a8" opacity="0.5" />
      <rect x="27" y="0" width="6" height="4" rx="1" fill="#c9b8a8" opacity="0.4" />
      <path d="M18 16 Q10 50 14 90 Q16 96 30 96 Q44 96 46 90 Q50 50 42 16 Z" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="8" y={96 - 80 * fill / 100} width="44" height={80 * fill / 100} clipPath={`url(#cp2-${uid})`} fill={color} opacity="0.4" />
      <path d="M18 16 Q10 50 14 90 Q16 96 30 96 Q44 96 46 90 Q50 50 42 16 Z" fill={`url(#shine2-${uid})`} />
      <path d="M22 24 Q20 44 21 64" stroke="white" strokeWidth="1.5" fill="none" opacity="0.06" strokeLinecap="round" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 70 100" width="70" height="100">
      <defs>
        <linearGradient id={`shine3-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.1" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        <clipPath id={`cp3-${uid}`}><ellipse cx="35" cy="55" rx="28" ry="38" /></clipPath>
      </defs>
      <rect x="29" y="2" width="12" height="8" rx="2" fill="silver" opacity="0.5" />
      <circle cx="35" cy="0" r="4" fill="silver" opacity="0.35" />
      <ellipse cx="35" cy="55" rx="28" ry="38" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="7" y={55 + 38 - 76 * fill / 100} width="56" height={76 * fill / 100} clipPath={`url(#cp3-${uid})`} fill={color} opacity="0.4" />
      <ellipse cx="35" cy="55" rx="28" ry="38" fill={`url(#shine3-${uid})`} />
      <ellipse cx="24" cy="38" rx="3" ry="14" fill="white" opacity="0.06" />
    </svg>
  ),
  (color: string, fill: number, uid: string) => (
    <svg viewBox="0 0 70 100" width="70" height="100">
      <defs>
        <linearGradient id={`shine4-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.12" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        <clipPath id={`cp4-${uid}`}><rect x="8" y="14" width="54" height="78" rx="4" /></clipPath>
      </defs>
      <rect x="26" y="2" width="18" height="8" rx="3" fill="#c9b8a8" opacity="0.5" />
      <rect x="30" y="0" width="10" height="4" rx="2" fill="#c9b8a8" opacity="0.4" />
      <rect x="8" y="14" width="54" height="78" rx="4" fill={color} opacity="0.12" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="8" y={14 + 78 * (1 - fill / 100)} width="54" height={78 * fill / 100} clipPath={`url(#cp4-${uid})`} fill={color} opacity="0.4" />
      <rect x="8" y="14" width="54" height="78" rx="4" fill={`url(#shine4-${uid})`} />
      <line x1="16" y1="22" x2="16" y2="55" stroke="white" strokeWidth="1.5" opacity="0.06" strokeLinecap="round" />
    </svg>
  ),
];

const BOTTLE_COLOR_MAP: Record<string, string> = {
  oriental: "#c4a890", gourmand: "#d4b8a0", woody: "#a89080", floral: "#dcc5b5",
  aquatic: "#b0a090", citrus: "#c9b8a8", green: "#a89585", fresh: "#c0b0a0",
  leather: "#8a7a6a",
};

function getBottleColor(family: string | null | undefined): string {
  if (!family) return "#b0a090";
  return BOTTLE_COLOR_MAP[family.toLowerCase()] || FAMILY_COLORS[family.charAt(0).toUpperCase() + family.slice(1).toLowerCase()] || "#b0a090";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

function NotePyramid({ fragrance, c }: { fragrance: Fragrance; c: ReturnType<typeof useColors> }) {
  const hasNotes = fragrance.topNotes?.length || fragrance.heartNotes?.length || fragrance.baseNotes?.length;
  if (!hasNotes) return null;
  const tierStyle = { display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "10px" };
  const labelStyle = { fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" as const, color: c.fgDim, marginBottom: "6px" };
  const noteChip = { padding: "3px 10px", background: c.inputBg, borderRadius: "20px", fontSize: "12px", color: c.fgSoft, lineHeight: 1.6 };
  return (
    <div style={{ marginTop: "16px" }}>
      {fragrance.topNotes?.length ? <div><p style={labelStyle}>Top</p><div style={tierStyle}>{fragrance.topNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div> : null}
      {fragrance.heartNotes?.length ? <div><p style={labelStyle}>Heart</p><div style={tierStyle}>{fragrance.heartNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div> : null}
      {fragrance.baseNotes?.length ? <div><p style={labelStyle}>Base</p><div style={tierStyle}>{fragrance.baseNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}</div></div> : null}
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
          <button data-testid="button-close-detail" onClick={onClose} style={{ background: "transparent", border: "none", color: c.fgDim, fontSize: "22px", cursor: "pointer", padding: "4px 8px" }}>{"\u00D7"}</button>
        </div>
        {matchScore !== undefined && (
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "6px", marginTop: "12px" }}>
            <span style={{ fontSize: "28px", fontWeight: 300, color: matchScore >= 70 ? c.green : c.fgSoft }}>{matchScore}%</span>
            <span style={{ fontSize: "12px", color: c.fgDim, letterSpacing: "0.15em", textTransform: "uppercase" }}>match</span>
          </div>
        )}
        {fragrance.family && (
          <div style={{ marginTop: "16px" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", fontSize: "11px", background: c.inputBg, borderRadius: "20px", color: c.fgLabel, letterSpacing: "0.15em", textTransform: "uppercase" }}>{fragrance.family}</span>
          </div>
        )}
        {fragrance.description && <p style={{ color: c.fgSoft, fontSize: "15px", lineHeight: 1.75, marginTop: "20px" }}>{fragrance.description}</p>}
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
          style={{ width: "100%", padding: "14px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "4px", color: c.fgMid, fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>Save</button>
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
  const slotsPerShelf = 5;
  const shelvesNeeded = Math.max(Math.ceil((items.length + 1) / slotsPerShelf), 1);

  return (
    <div data-testid="glass-shelf-vault" style={{ position: "relative", padding: "16px 0" }}>
      <div className="bokeh-container" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", width: `${3 + i * 2}px`, height: `${3 + i * 2}px`, borderRadius: "50%",
            background: c.isDark ? `rgba(255,255,255,${0.02 + i * 0.005})` : `rgba(200,180,140,${0.04 + i * 0.01})`,
            left: `${10 + i * 16}%`, top: `${10 + (i % 3) * 25}%`,
            animation: `bokehDrift ${6 + i * 2}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {Array.from({ length: shelvesNeeded }).map((_, shelfIdx) => {
        const shelfItems: (typeof items[0] | null)[] = [];
        for (let i = 0; i < slotsPerShelf; i++) {
          const idx = shelfIdx * slotsPerShelf + i;
          shelfItems.push(idx < items.length ? items[idx] : null);
        }
        return (
          <div key={shelfIdx} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "20px 8px 24px", position: "relative" }}>
              {shelfItems.map((slot, i) => {
                const globalIdx = shelfIdx * slotsPerShelf + i;
                if (!slot) {
                  if (globalIdx === items.length) {
                    return (
                      <div key={`empty-${globalIdx}`} data-testid="button-vault-add-slot"
                        onClick={onAdd}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "70px", minHeight: "130px", cursor: "pointer", border: `1px dashed ${c.borderColor}`, borderRadius: "8px", transition: "border-color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = c.borderHard)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = c.borderColor)}>
                        <span style={{ fontSize: "24px", color: c.fgMuted }}>+</span>
                      </div>
                    );
                  }
                  return <div key={`empty-${globalIdx}`} style={{ width: "70px" }} />;
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
                      width: "70px", minHeight: "130px", cursor: "pointer", position: "relative",
                      transform: isHovered ? "translateY(-10px) scale(1.05)" : "translateY(0) scale(1)",
                      transition: "transform 0.3s cubic-bezier(0.25,0.1,0.25,1)",
                    }}>
                    <div style={{
                      filter: isHovered ? `drop-shadow(0 4px 16px ${bottleColor}50)` : "none",
                      transition: "filter 0.3s ease",
                    }}>
                      {BOTTLE_SHAPES[shapeIdx](bottleColor, item.fillLevel ?? 100, item.id)}
                    </div>
                    {isHovered && (
                      <div style={{
                        position: "absolute", width: "40px", height: "4px", bottom: "20px",
                        borderRadius: "50%", background: `${c.gold}`,
                        filter: `blur(4px)`, opacity: 0.6,
                      }} />
                    )}
                    {isHovered && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                        background: c.panelBg, border: `1px solid ${c.borderColor}`, borderRadius: "10px",
                        padding: "12px 16px", whiteSpace: "nowrap", zIndex: 20,
                        boxShadow: c.isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
                        animation: "fadeUp 0.2s ease-out", minWidth: "140px", textAlign: "center",
                      }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 3px", color: c.fg }}>{item.fragrance?.name}</p>
                        <p style={{ fontSize: "11px", color: c.fgLabel, margin: "0 0 6px" }}>{item.fragrance?.house}</p>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                          {item.fillLevel != null && <span style={{ fontSize: "10px", color: c.fgDim }}>{item.fillLevel}% full</span>}
                          {item.matchScore ? <span style={{ fontSize: "10px", color: c.greenDim }}>{Math.round(item.matchScore)}% match</span> : null}
                        </div>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button data-testid={`button-vault-wear-${item.id}`}
                            onClick={e => { e.stopPropagation(); onLogWear(item.fragranceId); }}
                            style={{ padding: "3px 10px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "12px", fontSize: "10px", color: c.fgMid, cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>
                            Log Wear
                          </button>
                          <button data-testid={`button-details-vault-${item.id}`}
                            onClick={e => { e.stopPropagation(); if (item.fragrance) onDetail(item.fragrance); }}
                            style={{ padding: "3px 10px", background: "transparent", border: `1px solid ${c.chipBorder}`, borderRadius: "12px", fontSize: "10px", color: c.fgDim, cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>
                            Details
                          </button>
                          <button data-testid={`button-remove-vault-${item.id}`}
                            onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                            style={{ padding: "3px 10px", background: "transparent", border: `1px solid ${c.chipBorder}`, borderRadius: "12px", fontSize: "10px", color: "rgba(200,80,80,0.5)", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: "11px", color: c.fgLabel, margin: "6px 0 0", textAlign: "center", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {item.fragrance?.name}
                    </p>
                    {item.rating ? <span style={{ fontSize: "10px", color: c.goldDim }}>{"\u2605".repeat(item.rating)}</span> : null}
                    <div style={{
                      position: "absolute", bottom: "-2px", width: "50px", height: "6px",
                      background: c.isDark ? `radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)` : `radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)`,
                      borderRadius: "50%",
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{
              height: "3px",
              background: `linear-gradient(90deg, transparent 0%, ${c.shelfGlow} 15%, ${c.shelfGlow} 85%, transparent 100%)`,
              borderRadius: "2px",
              boxShadow: c.isDark
                ? `0 2px 20px rgba(212,175,55,0.1), 0 0 40px rgba(212,175,55,0.05)`
                : `0 1px 12px ${c.shelfGlow}`,
              borderTop: `1px solid ${c.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              borderBottom: `1px solid ${c.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
              margin: "0 16px",
            }} />
          </div>
        );
      })}
    </div>
  );
}

function ScentLogTab({ userId, vaultItems: vitems, c }: { userId: string; vaultItems: (VaultItem & { fragrance: Fragrance })[]; c: ReturnType<typeof useColors> }) {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [selectedFrag, setSelectedFrag] = useState<string | null>(null);
  const [logMood, setLogMood] = useState("");
  const [logNote, setLogNote] = useState("");

  const { data: wearLogs = [] } = useQuery<WearLogData[]>({
    queryKey: ["/api/users", userId, "wear-logs"],
    queryFn: async () => { const res = await fetch(`/api/users/${userId}/wear-logs`); return res.json(); },
  });

  const logWear = useMutation({
    mutationFn: async (data: { fragranceId: string; occasion?: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/wear-logs`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "wear-logs"] });
      setShowQuickLog(false); setSelectedFrag(null); setLogMood(""); setLogNote("");
    },
  });

  const moodIcons: Record<string, string> = {
    "Date Night": "\u2764", "Work": "\u25CB", "Travel": "\u2708",
    "Daily": "\u2606", "Casual": "\u223C", "Special Event": "\u2605",
  };

  return (
    <div data-testid="tab-content-log" style={{ animation: "fadeUp 0.5s ease-out" }}>
      <button data-testid="button-log-today"
        onClick={() => setShowQuickLog(!showQuickLog)}
        style={{
          width: "100%", padding: "18px", marginBottom: "28px",
          background: `linear-gradient(135deg, ${c.cardBg}, ${c.violet}08)`,
          border: `1px solid ${c.violetDim}30`, borderRadius: "14px",
          color: c.fgMid, fontSize: "16px", cursor: "pointer",
          fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.12em",
          transition: "all 0.2s",
        }}>
        Log today's scent
      </button>

      {showQuickLog && (
        <div style={{ marginBottom: "28px", padding: "20px", background: c.cardBg, borderRadius: "12px", border: `1px solid ${c.borderColor}`, animation: "slideUp 0.3s ease-out" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "12px" }}>Select a bottle</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "8px", marginBottom: "16px" }}>
            {vitems.map(v => (
              <div key={v.id} data-testid={`button-quicklog-${v.id}`}
                onClick={() => setSelectedFrag(v.fragranceId)}
                style={{
                  padding: "8px 4px", textAlign: "center", borderRadius: "8px", cursor: "pointer",
                  background: selectedFrag === v.fragranceId ? c.chipActive : "transparent",
                  border: `1px solid ${selectedFrag === v.fragranceId ? c.borderHard : c.chipBorder}`,
                  transition: "all 0.2s",
                }}>
                <div style={{ margin: "0 auto", width: "30px" }}>
                  {BOTTLE_SHAPES[vitems.indexOf(v) % 5](getBottleColor(v.fragrance?.family), v.fillLevel ?? 100, `ql-${v.id}`)}
                </div>
                <p style={{ fontSize: "8px", color: c.fgDim, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.fragrance?.name?.split(" ")[0]}</p>
              </div>
            ))}
          </div>
          {selectedFrag && (
            <>
              <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "8px" }}>Mood</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                {WEAR_OCCASIONS.map(occ => (
                  <button key={occ} onClick={() => setLogMood(logMood === occ ? "" : occ)}
                    style={{ padding: "5px 12px", background: logMood === occ ? c.chipActive : "transparent", border: `1px solid ${logMood === occ ? c.borderHard : c.chipBorder}`, borderRadius: "20px", color: logMood === occ ? c.fgMid : c.fgDim, fontSize: "11px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>
                    {occ}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Add a note (optional)" value={logNote} onChange={e => setLogNote(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "6px", color: c.fg, fontSize: "14px", fontFamily: "'Cormorant', Georgia, serif", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} />
              <button data-testid="button-quicklog-submit"
                onClick={() => logWear.mutate({ fragranceId: selectedFrag, occasion: logMood || undefined, notes: logNote || undefined })}
                disabled={logWear.isPending}
                style={{ width: "100%", padding: "12px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "6px", color: c.fgMid, fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>
                {logWear.isPending ? "..." : "Log Wear"}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {wearLogs.length === 0 ? (
          <p style={{ color: c.fgDim, textAlign: "center", padding: "40px 0" }}>No wear logs yet. Start logging your scents!</p>
        ) : wearLogs.map((log, idx) => {
          const fragName = log.fragrance?.name || "Unknown";
          const dateStr = new Date(log.wornAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const timeStr = new Date(log.wornAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          return (
            <div key={log.id} data-testid={`card-wearlog-${log.id}`}
              style={{
                display: "flex", gap: "14px", padding: "14px 0",
                borderBottom: idx < wearLogs.length - 1 ? `1px solid ${c.borderSoft}` : "none",
                alignItems: "flex-start",
              }}>
              <div style={{ width: "28px", flexShrink: 0, paddingTop: "2px" }}>
                {BOTTLE_SHAPES[idx % 5](getBottleColor(log.fragrance?.family), 80, `wl-${log.id}`)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <span style={{ fontSize: "17px", fontWeight: 400, color: c.fg }}>{fragName}</span>
                  {log.occasion && (
                    <span style={{ fontSize: "10px", padding: "2px 8px", background: c.chipActive, borderRadius: "10px", color: c.fgSoft }}>
                      {moodIcons[log.occasion] || ""} {log.occasion}
                    </span>
                  )}
                </div>
                {log.notes && <p style={{ fontSize: "13px", color: c.fgSoft, margin: "3px 0 0", lineHeight: 1.5 }}>{log.notes}</p>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "12px", color: c.fgDim, margin: 0 }}>{dateStr}</p>
                <p style={{ fontSize: "11px", color: c.fgMuted, margin: "2px 0 0" }}>{timeStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToTryTab({ userId, vaultFragIds, toTryItems: items, onDetail, c }: {
  userId: string; vaultFragIds: Set<string>;
  toTryItems: (ToTryItem & { fragrance: Fragrance })[];
  onDetail: (frag: Fragrance, matchScore?: number) => void;
  c: ReturnType<typeof useColors>;
}) {
  const archetype = getStoredUser()?.archetypeId ? ARCHETYPES[getStoredUser()!.archetypeId as ArchetypeId] : null;

  const addToVault = useMutation({
    mutationFn: async (fragranceId: string) => { const res = await apiRequest("POST", `/api/users/${userId}/vault`, { fragranceId }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "vault"] }); queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "to-try"] }); },
  });
  const removeFromToTry = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/to-try/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "to-try"] }); },
  });
  const updatePriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => { await apiRequest("PATCH", `/api/to-try/${id}`, { priority }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "to-try"] }); },
  });

  const aiRecs = items.filter(i => i.matchScore && i.matchScore >= 85).slice(0, 3);
  const userSaved = items.filter(i => !aiRecs.find(r => r.id === i.id));

  const priorityBadge = (p: string | null) => {
    const colors: Record<string, { bg: string; fg: string }> = {
      high: { bg: "rgba(212,184,160,0.15)", fg: c.gold },
      curious: { bg: `${c.violet}15`, fg: c.violet },
      someday: { bg: c.chipActive, fg: c.fgDim },
    };
    const labels: Record<string, string> = { high: "High Priority", curious: "Curious", someday: "Someday" };
    const s = colors[p || "curious"] || colors.curious;
    return (
      <span style={{ fontSize: "10px", padding: "2px 8px", background: s.bg, borderRadius: "10px", color: s.fg, letterSpacing: "0.06em" }}>
        {labels[p || "curious"] || "Curious"}
      </span>
    );
  };

  const renderCard = (item: ToTryItem & { fragrance: Fragrance }) => (
    <div key={item.id} data-testid={`card-try-${item.id}`}
      onClick={() => item.fragrance && onDetail(item.fragrance, item.matchScore ?? undefined)}
      style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "10px", padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <p style={{ fontSize: "18px", margin: 0, fontWeight: 400 }}>{item.fragrance?.name}</p>
            {priorityBadge(item.priority)}
          </div>
          <p style={{ color: c.fgLabel, fontSize: "13px", margin: "0 0 8px" }}>{item.fragrance?.house}</p>
          {item.fragrance?.family && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", padding: "2px 8px", background: c.inputBg, borderRadius: "10px", color: c.fgDim }}>{item.fragrance.family}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          {item.matchScore && (
            <div style={{ position: "relative", width: "44px", height: "44px" }}>
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="18" fill="none" stroke={c.borderColor} strokeWidth="2" />
                <circle cx="22" cy="22" r="18" fill="none" stroke={c.green} strokeWidth="2"
                  strokeDasharray={`${(item.matchScore / 100) * 113.1} 113.1`}
                  transform="rotate(-90 22 22)" strokeLinecap="round" />
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, color: c.fg }}>{Math.round(item.matchScore)}%</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
        {!vaultFragIds.has(item.fragranceId) && (
          <button data-testid={`button-try-to-vault-${item.id}`} onClick={e => { e.stopPropagation(); addToVault.mutate(item.fragranceId); removeFromToTry.mutate(item.id); }}
            style={{ padding: "5px 12px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "20px", color: c.fgMid, fontSize: "11px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif" }}>Own it</button>
        )}
        <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
          {["high", "curious", "someday"].map(p => (
            <button key={p} onClick={e => { e.stopPropagation(); updatePriority.mutate({ id: item.id, priority: p }); }}
              style={{
                padding: "3px 8px", borderRadius: "10px", fontSize: "9px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: item.priority === p ? c.chipActive : "transparent",
                border: `1px solid ${item.priority === p ? c.borderHard : c.chipBorder}`,
                color: item.priority === p ? c.fgMid : c.fgMuted,
              }}>{p === "high" ? "High" : p === "curious" ? "Curious" : "Someday"}</button>
          ))}
        </div>
        <button data-testid={`button-remove-try-${item.id}`} onClick={e => { e.stopPropagation(); removeFromToTry.mutate(item.id); }}
          style={{ background: "transparent", border: "none", color: c.fgMuted, fontSize: "16px", cursor: "pointer", padding: "2px" }}>{"\u00D7"}</button>
      </div>
    </div>
  );

  return (
    <div data-testid="tab-content-totry" style={{ animation: "fadeUp 0.5s ease-out" }}>
      {archetype && aiRecs.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: c.gold, letterSpacing: "0.06em" }}>Recommended for {archetype.name}</span>
            <span style={{ fontSize: "14px" }}>*</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
            {aiRecs.map(renderCard)}
          </div>
        </>
      )}
      {userSaved.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.fgLabel }}>Your Saved</span>
            <div style={{ flex: 1, height: "1px", background: c.borderSoft }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {userSaved.map(renderCard)}
          </div>
        </>
      )}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <p style={{ color: c.fgDim, fontSize: "16px", marginBottom: "8px" }}>Nothing on your list yet</p>
          <p style={{ color: c.fgMuted, fontSize: "14px" }}>Discover fragrances and add them to your wishlist.</p>
        </div>
      )}
    </div>
  );
}

function FeedTab({ userId, c }: { userId: string; c: ReturnType<typeof useColors> }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"review" | "recommendation">("review");
  const [selectedFragranceId, setSelectedFragranceId] = useState("");
  const [postRating, setPostRating] = useState(0);

  const { data: posts = [] } = useQuery<FeedPostData[]>({
    queryKey: ["/api/feed"],
    queryFn: async () => { const res = await fetch(`/api/feed?userId=${userId}`); return res.json(); },
  });

  const { data: allFragrances = [] } = useQuery<Fragrance[]>({
    queryKey: ["/api/fragrances"],
  });

  const { data: toTryItems = [] } = useQuery<(ToTryItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", userId, "to-try"],
    queryFn: async () => { const res = await fetch(`/api/users/${userId}/to-try`); return res.json(); },
  });

  const toTryFragIds = new Set(toTryItems.map(t => t.fragranceId));

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => { return apiRequest("POST", `/api/feed/${postId}/like`, { userId }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); },
  });
  const createPost = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/feed", { userId, type: postType, content: postContent, fragranceId: selectedFragranceId || undefined, rating: postRating || undefined });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); setShowPostModal(false); setPostContent(""); setSelectedFragranceId(""); setPostRating(0); },
  });
  const deletePost = useMutation({
    mutationFn: async (postId: string) => { return apiRequest("DELETE", `/api/feed/${postId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); },
  });

  const postTypeIcons: Record<string, string> = {
    review: "Review", recommendation: "Rec", wear_log: "Wear",
    bottle_shot: "Photo", tiktok_embed: "TikTok", layering_stack: "Layer",
  };

  const sampleCreators = new Set(["scentedbylayla", "fragrancebydan"]);

  return (
    <div data-testid="tab-content-feed" style={{ animation: "fadeUp 0.5s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 300, margin: 0, letterSpacing: "0.03em" }}>Feed</h2>
        <button data-testid="button-create-post" onClick={() => setShowPostModal(true)}
          style={{ padding: "9px 20px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "24px", color: c.fgMid, fontSize: "13px", cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.12em", transition: "all 0.2s ease" }}>
          Share
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.map(post => {
          const postArch = post.user?.archetypeId ? ARCHETYPES[post.user.archetypeId as ArchetypeId] : null;
          const isCreator = sampleCreators.has(post.user?.username || "");
          const inToTry = post.fragranceId && toTryFragIds.has(post.fragranceId);
          return (
            <div key={post.id} data-testid={`card-post-${post.id}`}
              style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: postArch ? `linear-gradient(135deg, ${postArch.color}40, ${postArch.color}20)` : c.cardBg,
                  border: `1px solid ${c.borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", fontFamily: "'Pinyon Script', cursive",
                  color: postArch ? postArch.color : c.fg, flexShrink: 0,
                }}>
                  {(post.user?.displayName || post.user?.username || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", color: c.fg }}>@{post.user?.username}</span>
                    {isCreator && <span style={{ fontSize: "10px", color: c.gold }}>CREATOR *</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    {postArch && (
                      <span style={{ fontSize: "10px", color: postArch.color, display: "flex", alignItems: "center", gap: "4px" }}>
                        {postArch.name}
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: postArch.color, display: "inline-block" }} />
                      </span>
                    )}
                    <span style={{ fontSize: "11px", color: c.fgMuted }}>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                {post.userId === userId && (
                  <button data-testid={`button-delete-post-${post.id}`} onClick={() => deletePost.mutate(post.id)}
                    style={{ background: "none", border: "none", color: c.fgMuted, cursor: "pointer", fontSize: "16px", padding: "4px" }}>{"\u00D7"}</button>
                )}
              </div>

              {post.rating && (
                <p style={{ fontSize: "14px", color: c.gold, margin: "0 0 8px" }}>
                  {"\u2605".repeat(post.rating)}<span style={{ color: c.fgMuted }}>{"\u2606".repeat(5 - post.rating)}</span>
                </p>
              )}

              {post.content && (
                <p style={{ fontSize: "15px", lineHeight: 1.7, margin: "0 0 12px", color: c.fgStrong }}>{post.content}</p>
              )}

              {post.fragrance && (
                <div style={{ padding: "10px 14px", background: c.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${c.borderColor}`, borderRadius: "8px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "14px", margin: "0 0 2px", fontWeight: 400 }}>{post.fragrance.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontSize: "12px", color: c.fgSoft, margin: 0 }}>{post.fragrance.house}</p>
                    {post.fragrance.family && (
                      <span style={{ fontSize: "9px", padding: "1px 6px", background: c.inputBg, borderRadius: "8px", color: c.fgDim }}>{post.fragrance.family}</span>
                    )}
                  </div>
                  {inToTry && <span style={{ fontSize: "10px", color: c.greenDim, marginTop: "4px", display: "inline-block" }}>In your To-Try</span>}
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <button data-testid={`button-like-post-${post.id}`}
                  onClick={() => likeMutation.mutate(post.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: post.liked ? c.gold : c.fgMuted, fontSize: "13px", padding: "4px 0", fontFamily: "inherit", transition: "color 0.2s" }}>
                  <span style={{ fontSize: "15px" }}>{post.liked ? "\u2665" : "\u2661"}</span>
                  {post.likeCount > 0 && <span>{post.likeCount}</span>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPostModal && (
        <div style={{ position: "fixed", inset: 0, background: c.overlayBg, display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPostModal(false); }}>
          <div style={{ width: "100%", maxWidth: "600px", background: c.panelBg, borderRadius: "16px 16px 0 0", padding: "28px 24px 40px", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 300, margin: 0 }}>Share</h3>
              <button onClick={() => setShowPostModal(false)} style={{ background: "none", border: "none", color: c.fgSoft, cursor: "pointer", fontSize: "20px" }}>{"\u00D7"}</button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {(["review", "recommendation"] as const).map(t => (
                <button key={t} data-testid={`button-post-type-${t}`} onClick={() => setPostType(t)}
                  style={{ padding: "6px 16px", borderRadius: "20px", background: postType === t ? c.chipActive : "transparent", border: `1px solid ${postType === t ? c.borderHard : c.borderColor}`, color: c.fg, cursor: "pointer", fontSize: "13px", fontFamily: "inherit", textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
            <select data-testid="select-post-fragrance" value={selectedFragranceId} onChange={e => setSelectedFragranceId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "6px", color: c.fg, fontSize: "14px", fontFamily: "inherit" }}>
              <option value="">Select a fragrance (optional)</option>
              {allFragrances.map(f => <option key={f.id} value={f.id}>{f.name} - {f.house}</option>)}
            </select>
            <textarea data-testid="input-post-content" value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Share your thoughts..."
              style={{ width: "100%", minHeight: "100px", padding: "12px", background: c.inputBg, border: `1px solid ${c.borderColor}`, borderRadius: "6px", color: c.fg, fontSize: "15px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
            {postType === "review" && (
              <div style={{ display: "flex", gap: "6px", margin: "12px 0" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} data-testid={`button-post-star-${star}`} onClick={() => setPostRating(star === postRating ? 0 : star)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "2px", color: star <= postRating ? c.gold : c.fgMuted }}>
                    {star <= postRating ? "\u2605" : "\u2606"}
                  </button>
                ))}
              </div>
            )}
            <button data-testid="button-submit-post" onClick={() => createPost.mutate()} disabled={!postContent.trim() || createPost.isPending}
              style={{ width: "100%", padding: "12px", marginTop: "16px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "6px", color: c.fg, cursor: "pointer", fontSize: "15px", fontFamily: "inherit", opacity: !postContent.trim() ? 0.4 : 1 }}>
              {createPost.isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExchangeTab({ c }: { c: ReturnType<typeof useColors> }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const drops = [
    { name: "Tresor Midnight Rose", house: "Lancome", was: 95, now: 67, ends: "23:14:07", gradient: "linear-gradient(135deg, #dcc5b5, #b89e8a)" },
    { name: "Cinema EDP", house: "Yves Saint Laurent", was: 110, now: 79, ends: "18:42:31", gradient: "linear-gradient(135deg, #c9b8a8, #8a7a6a)" },
    { name: "Idole L'Intense", house: "Giorgio Armani", was: 85, now: 58, ends: "06:08:55", gradient: "linear-gradient(135deg, #dcc5b5, #a89585)" },
  ];

  const listings = [
    { name: "Chanel No. 5 EDP", fill: 80, seller: "@velvet.nina", archColor: "#b89e8a", price: 62, certified: true, match: 84 },
    { name: "Tom Ford Noir", fill: 60, seller: "@baroque.queen", archColor: "#8a7a6a", price: 74, certified: false, match: 0 },
    { name: "Mojave Ghost", fill: 90, seller: "@greenscents", archColor: "#a89080", price: 88, certified: true, match: 87 },
    { name: "Flowerbomb", fill: 45, seller: "@scentedbylayla", archColor: "#8a7a6a", price: 55, certified: false, match: 0 },
    { name: "Miss Dior Blooming", fill: 70, seller: "@cecifrag", archColor: "#d4b8a0", price: 48, certified: true, match: 0 },
    { name: "Flower Market", fill: 55, seller: "@thecanvas.co", archColor: "#9a8a7a", price: 71, certified: false, match: 0 },
  ];

  const filters = ["All", "Certified", "High Match", "Under $50", "Near Full"];

  if (!isSubscribed) {
    return (
      <div data-testid="tab-content-exchange" style={{ animation: "fadeUp 0.5s ease-out", position: "relative" }}>
        <div style={{ filter: "blur(6px)", opacity: 0.3, pointerEvents: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {listings.map((l, i) => (
              <div key={i} style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "10px", padding: "16px", height: "120px" }}>
                <p style={{ fontSize: "14px", color: c.fg }}>{l.name}</p>
                <p style={{ fontSize: "12px", color: c.fgDim }}>${l.price}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: c.isDark ? "rgba(0,0,0,0.6)" : "rgba(255,248,245,0.7)",
          backdropFilter: "blur(4px)", borderRadius: "12px", padding: "40px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", color: c.gold }}>*</div>
          <h3 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "36px", color: c.gold, fontWeight: 400, margin: "0 0 12px" }}>The Exchange</h3>
          <p style={{ color: c.fgSoft, fontSize: "17px", marginBottom: "18px", lineHeight: 1.7, fontStyle: "italic" }}>Members only. Buy and sell authenticated luxury fragrance.</p>
          <p style={{ color: c.fgDim, fontSize: "14px", margin: "0 0 5px" }}>Peer-to-peer authenticated resale</p>
          <p style={{ color: c.fgDim, fontSize: "14px", margin: "0 0 28px" }}>Exclusive discontinued drops</p>
          <button data-testid="button-join-exchange"
            onClick={() => setIsSubscribed(true)}
            style={{
              padding: "14px 32px", background: `linear-gradient(135deg, ${c.gold}, rgba(212,184,160,0.7))`,
              border: "none", borderRadius: "30px", color: "#000", fontSize: "14px",
              fontFamily: "'Cormorant', Georgia, serif", letterSpacing: "0.1em", cursor: "pointer",
              fontWeight: 500,
            }}>
            Join the Exchange - $9.99/mo
          </button>
          <p style={{ color: c.fgMuted, fontSize: "12px", marginTop: "10px" }}>or $89/yr - Cancel anytime</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="tab-content-exchange" style={{ animation: "fadeUp 0.5s ease-out" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 400, margin: 0, color: c.gold }}>L'Oreal Drops</h3>
          <span style={{ fontSize: "12px", color: c.fgDim }}>Limited time</span>
        </div>
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
          {drops.map((drop, i) => (
            <div key={i} data-testid={`card-drop-${i}`}
              style={{ minWidth: "220px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${c.borderColor}`, flexShrink: 0 }}>
              <div style={{ height: "100px", background: drop.gradient, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ position: "absolute", top: "8px", left: "8px", fontSize: "9px", padding: "2px 8px", background: "rgba(212,175,55,0.9)", borderRadius: "4px", color: "#000", fontWeight: 600, letterSpacing: "0.1em" }}>DISCONTINUED</span>
              </div>
              <div style={{ padding: "12px 14px", background: c.cardBg }}>
                <p style={{ fontSize: "14px", margin: "0 0 2px", color: c.fg }}>{drop.name}</p>
                <p style={{ fontSize: "11px", color: c.fgDim, margin: "0 0 6px" }}>{drop.house}</p>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: c.fgMuted, textDecoration: "line-through" }}>${drop.was}</span>
                  <span style={{ fontSize: "16px", color: c.gold, fontWeight: 500 }}>${drop.now}</span>
                </div>
                <p style={{ fontSize: "10px", color: c.fgDim, margin: "0 0 8px" }}>Drop ends in: {drop.ends}</p>
                <button style={{ width: "100%", padding: "8px", background: c.chipActive, border: `1px solid ${c.borderHard}`, borderRadius: "6px", color: c.fgMid, fontSize: "11px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif", letterSpacing: "0.1em" }}>
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f.toLowerCase().replace(/\s/g, "-"))}
            style={{
              padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
              background: activeFilter === f.toLowerCase().replace(/\s/g, "-") ? c.chipActive : "transparent",
              border: `1px solid ${activeFilter === f.toLowerCase().replace(/\s/g, "-") ? c.borderHard : c.chipBorder}`,
              color: activeFilter === f.toLowerCase().replace(/\s/g, "-") ? c.fgMid : c.fgDim,
            }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {listings.map((listing, i) => (
          <div key={i} data-testid={`card-listing-${i}`}
            style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "10px", padding: "14px", cursor: "pointer" }}>
            <div style={{ width: "40px", margin: "0 auto 8px" }}>
              {BOTTLE_SHAPES[i % 5]("#b0a090", listing.fill, `ex-${i}`)}
            </div>
            <p style={{ fontSize: "13px", margin: "0 0 2px", color: c.fg, textAlign: "center" }}>{listing.name}</p>
            <p style={{ fontSize: "11px", color: c.fgDim, margin: "0 0 6px", textAlign: "center" }}>~{listing.fill}% full</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: c.fgSoft }}>{listing.seller}</span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: listing.archColor, display: "inline-block" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 500, color: c.fg }}>${listing.price}</span>
              {listing.certified && <span style={{ fontSize: "9px", color: c.greenDim }}>Certified</span>}
            </div>
            {listing.match > 0 && <p style={{ fontSize: "10px", color: c.greenDim, textAlign: "center", margin: "4px 0 0" }}>Match: {listing.match}%</p>}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <button data-testid="button-unsubscribe-exchange" onClick={() => setIsSubscribed(false)}
          style={{ background: "none", border: "none", color: c.fgMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
          (Demo: toggle subscription off)
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ userId, c }: { userId: string; c: ReturnType<typeof useColors> }) {
  const user = getStoredUser();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const archetype = user?.archetypeId ? ARCHETYPES[user.archetypeId as ArchetypeId] : null;

  const { data: vaultItems = [] } = useQuery<VaultItem[]>({
    queryKey: ["/api/users", userId, "vault"],
    queryFn: async () => { const res = await fetch(`/api/users/${userId}/vault`); return res.json(); },
  });
  const { data: wearLogs = [] } = useQuery<WearLogData[]>({
    queryKey: ["/api/users", userId, "wear-logs"],
    queryFn: async () => { const res = await fetch(`/api/users/${userId}/wear-logs`); return res.json(); },
  });
  const { data: posts = [] } = useQuery<FeedPostData[]>({
    queryKey: ["/api/feed"],
    queryFn: async () => { const res = await fetch(`/api/feed?userId=${userId}`); return res.json(); },
  });

  const myPosts = posts.filter(p => p.userId === userId);

  const scentDna = [
    { name: "Amber", pct: 78, color: "#c4a890" },
    { name: "Woody", pct: 64, color: "#a89080" },
    { name: "Floral", pct: 51, color: "#dcc5b5" },
    { name: "Musk", pct: 43, color: "#9a8a7a" },
    { name: "Citrus", pct: 31, color: "#c9b8a8" },
  ];

  const funStats = [
    { label: "Most worn time", value: "Evening" },
    { label: "Fave season", value: "Autumn" },
    { label: "Top house", value: "YSL" },
    { label: "Avg reapplications", value: "1.4/day" },
    { label: "Logging streak", value: "12 days" },
    { label: "Most worn bottle", value: "La Vie Est Belle" },
    { label: "Signature mood", value: "Date Night" },
    { label: "Rarest bottle", value: "Black Orchid" },
  ];

  return (
    <div data-testid="tab-content-profile" style={{ animation: "fadeUp 0.5s ease-out" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 16px",
          background: archetype ? `linear-gradient(135deg, ${archetype.color}60, ${archetype.color}20)` : c.cardBg,
          border: `2px solid ${c.gold}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", fontFamily: "'Pinyon Script', cursive", color: c.fg,
        }}>
          {(user?.displayName || user?.username || "?").charAt(0).toUpperCase()}
        </div>
        <p style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 6px", color: c.fg, letterSpacing: "0.02em" }}>@{user?.username}</p>
        {archetype && (
          <>
            <span style={{
              display: "inline-block", padding: "6px 18px", fontSize: "13px",
              background: `${archetype.color}20`, border: `1px solid ${archetype.color}40`,
              borderRadius: "24px", color: archetype.color, marginBottom: "10px",
              letterSpacing: "0.1em",
            }}>
              {archetype.name}
            </span>
            <p style={{ color: c.fgSoft, fontSize: "16px", maxWidth: "360px", margin: "10px auto 0", lineHeight: 1.7, fontStyle: "italic" }}>{archetype.description}</p>
          </>
        )}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
          <button data-testid="button-edit-profile" style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${c.borderColor}`, borderRadius: "24px", color: c.fgDim, fontSize: "13px", cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.08em", transition: "all 0.2s ease" }}>Edit Profile</button>
          <button data-testid="button-retake-quiz" onClick={() => setLocation("/quiz?retake=true")}
            style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${c.borderColor}`, borderRadius: "24px", color: c.fgDim, fontSize: "13px", cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.08em", transition: "all 0.2s ease" }}>Retake Quiz</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { n: vaultItems.length, l: "Collection" },
          { n: wearLogs.length, l: "Wears" },
          { n: myPosts.length, l: "Posts" },
          { n: 47, l: "Following" },
          { n: 312, l: "Followers" },
        ].map(s => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "26px", fontWeight: 300, margin: "0 0 4px", color: c.fg }}>{s.n}</p>
            <p style={{ fontSize: "12px", color: c.fgDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{s.l}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "14px", letterSpacing: "0.25em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "20px", fontWeight: 500 }}>Your Scent DNA</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {scentDna.map(d => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ width: "60px", fontSize: "14px", color: c.fgSoft, textAlign: "right", fontWeight: 400 }}>{d.name}</span>
              <div style={{ flex: 1, height: "10px", background: c.inputBg, borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: `linear-gradient(90deg, ${d.color}cc, ${d.color})`, borderRadius: "5px", transition: "width 0.8s cubic-bezier(0.25,0.1,0.25,1)" }} />
              </div>
              <span style={{ width: "40px", fontSize: "14px", color: c.fgDim, fontWeight: 400 }}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "14px", letterSpacing: "0.25em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "20px", fontWeight: 500 }}>Your Fragrance Life</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {funStats.map(s => (
            <div key={s.label} style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "12px", padding: "16px 18px" }}>
              <p style={{ fontSize: "12px", color: c.fgDim, margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ fontSize: "17px", color: c.fg, margin: 0, fontWeight: 400 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "14px", letterSpacing: "0.25em", textTransform: "uppercase", color: c.fgLabel, margin: 0, fontWeight: 500 }}>Theme</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: c.fgDim }}>Light</span>
            <button data-testid="button-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{
                width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer", border: "none",
                background: c.isDark ? c.chipActive : c.borderColor, position: "relative", transition: "background 0.2s",
              }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", background: c.fg,
                position: "absolute", top: "3px", left: c.isDark ? "23px" : "3px", transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: "12px", color: c.fgDim }}>Dark</span>
          </div>
        </div>
      </div>

      {myPosts.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "14px", letterSpacing: "0.25em", textTransform: "uppercase", color: c.fgLabel, marginBottom: "16px", fontWeight: 500 }}>From the Feed</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {myPosts.slice(0, 3).map(post => (
              <div key={post.id} style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "8px", padding: "12px 14px" }}>
                {post.rating && <p style={{ fontSize: "12px", color: c.gold, margin: "0 0 4px" }}>{"\u2605".repeat(post.rating)}</p>}
                <p style={{ fontSize: "14px", color: c.fgStrong, margin: "0 0 4px", lineHeight: 1.5 }}>{post.content?.slice(0, 100)}{(post.content?.length || 0) > 100 ? "..." : ""}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {post.fragrance && <span style={{ fontSize: "11px", color: c.fgDim }}>{post.fragrance.name}</span>}
                  <span style={{ fontSize: "11px", color: c.fgMuted }}>{post.likeCount} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
        <p style={{ fontSize: "12px", color: c.fgMuted, marginBottom: "16px" }}>
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "2025"}
        </p>
        <button data-testid="button-logout" onClick={() => { clearUser(); setLocation("/"); }}
          style={{ padding: "10px 28px", background: "transparent", border: `1px solid ${c.borderColor}`, borderRadius: "24px", color: c.fgDim, fontSize: "14px", cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.12em", transition: "all 0.2s ease" }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>("vault");
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("feed");
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

  const { data: vaultItems = [] } = useQuery<(VaultItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", user.id, "vault"],
    queryFn: async () => { const res = await fetch(`/api/users/${user.id}/vault`); return res.json(); },
  });

  const { data: recommendations = [] } = useQuery<(Fragrance & { matchScore: number })[]>({
    queryKey: ["/api/users", user.id, "recommendations"],
    queryFn: async () => { const res = await fetch(`/api/users/${user.id}/recommendations`); return res.json(); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); setShowAddModal(false); setDetailFragrance(null); setSearchQuery(""); },
  });
  const addToTry = useMutation({
    mutationFn: async ({ fragranceId, priority }: { fragranceId: string; priority: string }) => { const res = await apiRequest("POST", `/api/users/${user.id}/to-try`, { fragranceId, priority }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] }); setDetailFragrance(null); },
  });
  const removeFromVault = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/vault/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); },
  });
  const updateVaultItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => { const res = await apiRequest("PATCH", `/api/vault/${id}`, updates); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] }); setEditingVaultItem(null); },
  });
  const logWear = useMutation({
    mutationFn: async ({ fragranceId, occasion, notes }: { fragranceId: string; occasion?: string; notes?: string }) => { const res = await apiRequest("POST", `/api/users/${user.id}/wear-logs`, { fragranceId, occasion, notes }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "wear-logs"] }); queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); setWearLogFragId(null); },
  });

  const vaultFragIds = new Set(vaultItems.map(v => v.fragranceId));

  const wearLogFragName = wearLogFragId ? (vaultItems.find(v => v.fragranceId === wearLogFragId)?.fragrance?.name || "Fragrance") : "";

  const subTabStyle = (active: boolean) => ({
    padding: "12px 0", background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${c.gold}` : "2px solid transparent",
    color: active ? c.fgStrong : c.fgDim, fontSize: "15px",
    letterSpacing: "0.18em", textTransform: "uppercase" as const,
    cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif",
    transition: "all 0.3s ease", flex: 1, fontWeight: active ? 600 : 400,
  });

  const bottomNavIcon = (tab: MainTab, label: string) => {
    const active = mainTab === tab;
    const icons: Record<MainTab, string> = { home: "\u2302", explore: "\u2661", profile: "\u2609" };
    return (
      <button key={tab} data-testid={`nav-${tab}`}
        onClick={() => setMainTab(tab)}
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
          background: "none", border: "none", cursor: "pointer", padding: "10px 0 6px",
          color: active ? c.gold : c.fgDim, transition: "all 0.3s ease",
          position: "relative",
        }}>
        <span style={{ fontSize: "22px", transition: "transform 0.3s ease", transform: active ? "scale(1.15)" : "scale(1)" }}>{icons[tab]}</span>
        <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: active ? 600 : 400 }}>{label}</span>
        {active && <span style={{ position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)", width: "24px", height: "2px", background: c.gold, borderRadius: "2px" }} />}
      </button>
    );
  };

  return (
    <div data-testid="dashboard-page" style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif", color: c.fg }}>
      <header style={{ padding: "20px clamp(20px, 5vw, 40px) 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "32px", fontWeight: 400, margin: 0, color: c.gold, letterSpacing: "0.02em" }}>Sillage</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {archetype && (
            <span style={{ fontSize: "12px", color: archetype.color, letterSpacing: "0.08em", opacity: 0.7 }}>{archetype.name}</span>
          )}
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: archetype ? `linear-gradient(135deg, ${archetype.color}40, ${archetype.color}15)` : c.cardBg,
            border: `1.5px solid ${c.gold}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "15px", fontFamily: "'Pinyon Script', cursive", color: c.fg,
          }}>
            {(user.displayName || user.username || "?").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main style={{ padding: "0 clamp(16px, 4vw, 40px) 100px", maxWidth: "720px", margin: "0 auto" }}>
        {mainTab === "home" && (
          <>
            <div style={{ marginBottom: "12px", textAlign: "center" }}>
              {archetype && (
                <p style={{ fontSize: "13px", color: c.goldDim, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px", fontWeight: 500 }}>{archetype.name}</p>
              )}
              <p style={{ fontSize: "16px", color: c.fgSoft, margin: 0, fontStyle: "italic" }}>{vaultItems.length} bottles in your vault</p>
            </div>

            <nav style={{ display: "flex", borderBottom: `1px solid ${c.borderSoft}`, marginBottom: "24px" }}>
              {([["vault", "My Vault"], ["log", "Scent Log"], ["totry", "To Try"]] as [HomeSubTab, string][]).map(([key, label]) => (
                <button key={key} data-testid={`subtab-${key}`} onClick={() => setHomeSubTab(key)} style={subTabStyle(homeSubTab === key)}>{label}</button>
              ))}
            </nav>

            {homeSubTab === "vault" && (
              <div style={{ animation: "fadeUp 0.5s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                  <button data-testid="button-add-to-vault" onClick={() => setShowAddModal(true)}
                    style={{ padding: "8px 18px", background: c.chipActive, border: `1px solid ${c.borderColor}`, borderRadius: "24px", color: c.fgMid, fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", transition: "all 0.2s ease" }}>+ Add</button>
                </div>
                <GlassShelfVault
                  items={vaultItems}
                  onEdit={setEditingVaultItem}
                  onDetail={setDetailFragrance}
                  onRemove={(id) => removeFromVault.mutate(id)}
                  onAdd={() => setShowAddModal(true)}
                  onLogWear={(fid) => setWearLogFragId(fid)}
                  c={c}
                />
              </div>
            )}

            {homeSubTab === "log" && (
              <ScentLogTab userId={user.id} vaultItems={vaultItems} c={c} />
            )}

            {homeSubTab === "totry" && (
              <ToTryTab userId={user.id} vaultFragIds={vaultFragIds} toTryItems={toTryItems}
                onDetail={(frag, score) => setDetailFragrance({ ...frag, matchScore: score } as any)} c={c} />
            )}
          </>
        )}

        {mainTab === "explore" && (
          <>
            <nav style={{ display: "flex", borderBottom: `1px solid ${c.borderSoft}`, marginBottom: "24px" }}>
              {([["feed", "Feed"], ["exchange", "Exchange"]] as [ExploreSubTab, string][]).map(([key, label]) => (
                <button key={key} data-testid={`subtab-${key}`} onClick={() => setExploreSubTab(key)} style={subTabStyle(exploreSubTab === key)}>{label}</button>
              ))}
            </nav>

            {exploreSubTab === "feed" && <FeedTab userId={user.id} c={c} />}
            {exploreSubTab === "exchange" && <ExchangeTab c={c} />}
          </>
        )}

        {mainTab === "profile" && <ProfileTab userId={user.id} c={c} />}
      </main>

      <nav data-testid="bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: c.isDark ? "rgba(6,6,6,0.97)" : "rgba(255,252,250,0.97)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${c.isDark ? "rgba(212,175,55,0.1)" : "rgba(0,0,0,0.06)"}`,
        display: "flex", padding: "4px 0 env(safe-area-inset-bottom, 10px)",
        zIndex: 50,
        boxShadow: c.isDark ? "0 -4px 24px rgba(0,0,0,0.5)" : "0 -2px 16px rgba(0,0,0,0.04)",
      }}>
        {bottomNavIcon("home", "Home")}
        {bottomNavIcon("explore", "Explore")}
        {bottomNavIcon("profile", "Profile")}
      </nav>

      {showAddModal && (
        <div data-testid="add-modal-overlay" onClick={() => { setShowAddModal(false); setSearchQuery(""); }}
          style={{ position: "fixed", inset: 0, background: c.overlayBg, zIndex: 55, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
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
                  style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, borderRadius: "8px", padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "16px", margin: "0 0 3px" }}>{frag.name}</p>
                    <p style={{ color: c.fgDim, fontSize: "13px", margin: 0 }}>{frag.house}</p>
                  </div>
                  <span style={{ color: c.fgMuted, fontSize: "20px" }}>+</span>
                </div>
              ))}
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
          inTry={new Set(toTryItems.map(t => t.fragranceId)).has(detailFragrance.id)}
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
        @keyframes bokehDrift {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
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
