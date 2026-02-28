import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser, clearUser } from "@/lib/auth";
import { ARCHETYPES, type ArchetypeId, type Fragrance, type VaultItem, type ToTryItem } from "@shared/schema";

type Tab = "home" | "vault" | "discover" | "to-try";

const PRIORITIES = [
  { value: "must-try", label: "Must Try" },
  { value: "curious", label: "Curious" },
  { value: "someday", label: "Someday" },
];

function NotePyramid({ fragrance }: { fragrance: Fragrance }) {
  const hasNotes = fragrance.topNotes?.length || fragrance.heartNotes?.length || fragrance.baseNotes?.length;
  if (!hasNotes) return null;

  const tierStyle = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
    marginBottom: "10px",
  };
  const labelStyle = {
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
    marginBottom: "6px",
  };
  const noteChip = {
    padding: "3px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
  };

  return (
    <div style={{ marginTop: "16px" }}>
      {fragrance.topNotes?.length ? (
        <div>
          <p style={labelStyle}>Top</p>
          <div style={tierStyle}>
            {fragrance.topNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}
          </div>
        </div>
      ) : null}
      {fragrance.heartNotes?.length ? (
        <div>
          <p style={labelStyle}>Heart</p>
          <div style={tierStyle}>
            {fragrance.heartNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}
          </div>
        </div>
      ) : null}
      {fragrance.baseNotes?.length ? (
        <div>
          <p style={labelStyle}>Base</p>
          <div style={tierStyle}>
            {fragrance.baseNotes.map(n => <span key={n} style={noteChip}>{n}</span>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          data-testid={`button-star-${star}`}
          onClick={() => onChange(star === value ? 0 : star)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: star <= value ? "rgba(212,175,55,0.85)" : "rgba(255,255,255,0.12)",
            padding: "2px",
            transition: "color 0.2s ease",
          }}
        >
          {star <= value ? "\u2605" : "\u2606"}
        </button>
      ))}
    </div>
  );
}

function FragranceDetailPanel({
  fragrance,
  matchScore,
  onClose,
  onAddVault,
  onAddTry,
  inVault,
  inTry,
}: {
  fragrance: Fragrance;
  matchScore?: number;
  onClose: () => void;
  onAddVault: () => void;
  onAddTry: (priority: string) => void;
  inVault: boolean;
  inTry: boolean;
}) {
  return (
    <div
      data-testid="fragrance-detail-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        data-testid="fragrance-detail-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          background: "#0a0a0a",
          borderRadius: "12px",
          padding: "32px 28px",
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'Cormorant', Georgia, serif",
          color: "#fff",
          animation: "slideUp 0.35s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div style={{ flex: 1 }}>
            <h2 data-testid="text-detail-name" style={{ fontSize: "24px", fontWeight: 400, margin: "0 0 4px", lineHeight: 1.3 }}>
              {fragrance.name}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", margin: "0 0 2px" }}>
              {fragrance.house}
            </p>
            {fragrance.concentration && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>
                {fragrance.concentration}
              </p>
            )}
          </div>
          <button
            data-testid="button-close-detail"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontSize: "22px",
              cursor: "pointer",
              padding: "4px 8px",
              marginTop: "-4px",
            }}
          >
            \u00D7
          </button>
        </div>

        {matchScore !== undefined && (
          <div style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "6px",
            marginTop: "12px",
            marginBottom: "4px",
          }}>
            <span style={{
              fontSize: "28px",
              fontWeight: 300,
              color: matchScore >= 70 ? "rgba(180,220,180,0.85)" : matchScore >= 50 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)",
            }}>
              {matchScore}%
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              match
            </span>
          </div>
        )}

        {fragrance.family && (
          <div style={{ marginTop: "16px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              fontSize: "11px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "20px",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              {fragrance.family}
            </span>
          </div>
        )}

        {fragrance.description && (
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "15px",
            lineHeight: 1.75,
            marginTop: "20px",
            marginBottom: "0",
          }}>
            {fragrance.description}
          </p>
        )}

        <NotePyramid fragrance={fragrance} />

        {!inVault && !inTry && (
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              data-testid="button-detail-add-vault"
              onClick={onAddVault}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.75)",
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Cormorant', Georgia, serif",
              }}
            >
              Add to Vault
            </button>
            <button
              data-testid="button-detail-add-try"
              onClick={() => onAddTry("curious")}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.5)",
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Cormorant', Georgia, serif",
              }}
            >
              Add to Try
            </button>
          </div>
        )}
        {inVault && (
          <p style={{ marginTop: "20px", fontSize: "12px", color: "rgba(180,220,180,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            In your vault
          </p>
        )}
        {inTry && !inVault && (
          <p style={{ marginTop: "20px", fontSize: "12px", color: "rgba(212,175,55,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            On your to-try list
          </p>
        )}
      </div>
    </div>
  );
}

function VaultEditPanel({
  item,
  fragrance,
  onClose,
  onSave,
}: {
  item: VaultItem;
  fragrance: Fragrance;
  onClose: () => void;
  onSave: (updates: any) => void;
}) {
  const [rating, setRating] = useState(item.rating || 0);
  const [notes, setNotes] = useState(item.notes || "");
  const [bottleSize, setBottleSize] = useState(item.bottleSize || "");
  const [fillLevel, setFillLevel] = useState(item.fillLevel || 100);
  const [wearFrequency, setWearFrequency] = useState(item.wearFrequency || "");

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "'Cormorant', Georgia, serif",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      data-testid="vault-edit-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        data-testid="vault-edit-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          background: "#0a0a0a",
          borderRadius: "12px",
          padding: "32px 28px",
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'Cormorant', Georgia, serif",
          color: "#fff",
          animation: "slideUp 0.35s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 4px" }}>{fragrance.name}</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>{fragrance.house}</p>
          </div>
          <button data-testid="button-close-edit" onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "22px", cursor: "pointer" }}>
            \u00D7
          </button>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
            Your Rating
          </p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
            Personal Notes
          </p>
          <textarea
            data-testid="input-vault-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How does this one make you feel?"
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: 1.7,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
              Bottle Size
            </p>
            <select
              data-testid="select-bottle-size"
              value={bottleSize}
              onChange={e => setBottleSize(e.target.value)}
              style={{ ...inputStyle, appearance: "none" }}
            >
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
            <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
              Fill Level
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                data-testid="input-fill-level"
                type="range"
                min={0}
                max={100}
                value={fillLevel}
                onChange={e => setFillLevel(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "rgba(255,255,255,0.4)" }}
              />
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", minWidth: "36px", textAlign: "right" }}>
                {fillLevel}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
            Wear Frequency
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["Daily", "Weekly", "Occasion", "Seasonal", "Rarely"].map(freq => (
              <button
                key={freq}
                data-testid={`button-freq-${freq.toLowerCase()}`}
                onClick={() => setWearFrequency(wearFrequency === freq ? "" : freq)}
                style={{
                  padding: "7px 16px",
                  background: wearFrequency === freq ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${wearFrequency === freq ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "20px",
                  color: wearFrequency === freq ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "'Cormorant', Georgia, serif",
                  transition: "all 0.2s ease",
                }}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        <button
          data-testid="button-save-vault-edit"
          onClick={() => onSave({ rating: rating || null, notes: notes || null, bottleSize: bottleSize || null, fillLevel, wearFrequency: wearFrequency || null })}
          style={{
            width: "100%",
            padding: "14px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'Cormorant', Georgia, serif",
            transition: "all 0.2s ease",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailFragrance, setDetailFragrance] = useState<(Fragrance & { matchScore?: number }) | null>(null);
  const [editingVaultItem, setEditingVaultItem] = useState<(VaultItem & { fragrance: Fragrance }) | null>(null);
  const [, setLocation] = useLocation();
  const user = getStoredUser();

  useEffect(() => {
    if (!user) setLocation("/access");
    else if (!user.onboardingComplete) setLocation("/quiz");
  }, [user, setLocation]);

  if (!user) return null;

  const archetype = user.archetypeId ? ARCHETYPES[user.archetypeId as ArchetypeId] : null;

  const { data: recommendations = [] } = useQuery<(Fragrance & { matchScore: number })[]>({
    queryKey: ["/api/users", user.id, "recommendations"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user.id}/recommendations`);
      return res.json();
    },
  });

  const { data: vaultItems = [] } = useQuery<(VaultItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", user.id, "vault"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user.id}/vault`);
      return res.json();
    },
  });

  const { data: toTryItems = [] } = useQuery<(ToTryItem & { fragrance: Fragrance })[]>({
    queryKey: ["/api/users", user.id, "to-try"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user.id}/to-try`);
      return res.json();
    },
  });

  const { data: searchResults = [] } = useQuery<Fragrance[]>({
    queryKey: ["/api/fragrances", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/fragrances?search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.trim().length > 1,
  });

  const addToVault = useMutation({
    mutationFn: async (fragranceId: string) => {
      const res = await apiRequest("POST", `/api/users/${user.id}/vault`, { fragranceId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] });
      setShowAddModal(false);
      setDetailFragrance(null);
      setSearchQuery("");
    },
  });

  const addToTry = useMutation({
    mutationFn: async ({ fragranceId, priority }: { fragranceId: string; priority: string }) => {
      const res = await apiRequest("POST", `/api/users/${user.id}/to-try`, { fragranceId, priority });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] });
      setDetailFragrance(null);
    },
  });

  const removeFromVault = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vault/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "recommendations"] });
    },
  });

  const removeFromToTry = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/to-try/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] });
    },
  });

  const updateVaultItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/vault/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "vault"] });
      setEditingVaultItem(null);
    },
  });

  const updateToTryPriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const res = await apiRequest("PATCH", `/api/to-try/${id}`, { priority });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "to-try"] });
    },
  });

  const handleLogout = () => {
    clearUser();
    setLocation("/");
  };

  const vaultFragIds = new Set(vaultItems.map(v => v.fragranceId));
  const toTryFragIds = new Set(toTryItems.map(t => t.fragranceId));

  const tabStyle = (t: Tab) => ({
    padding: "12px 0",
    background: "transparent",
    border: "none",
    borderBottom: activeTab === t ? "2px solid rgba(255,255,255,0.6)" : "2px solid transparent",
    color: activeTab === t ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
    fontSize: "13px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.3s ease",
    flex: 1,
    fontWeight: activeTab === t ? 500 : 400,
  });

  const sectionLabel = {
    fontSize: "13px",
    fontWeight: 400 as const,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.45)",
    margin: "0 0 20px",
  };

  const cardBase = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px",
    padding: "20px",
    transition: "border-color 0.3s ease",
    cursor: "pointer",
  };

  const actionBtn = (filled = false) => ({
    padding: "8px 18px",
    background: filled ? "rgba(255,255,255,0.07)" : "transparent",
    border: `1px solid rgba(255,255,255,${filled ? 0.12 : 0.08})`,
    borderRadius: "4px",
    color: `rgba(255,255,255,${filled ? 0.65 : 0.4})`,
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.2s ease",
  });

  return (
    <div data-testid="dashboard-page" style={{
      minHeight: "100vh",
      background: "#000",
      fontFamily: "'Cormorant', Georgia, serif",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      <header style={{
        padding: "20px clamp(20px, 5vw, 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <h1 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "28px", fontWeight: 400, margin: 0 }}>
          Sillage
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            {user.displayName || user.username}
          </span>
          <button data-testid="button-logout" onClick={handleLogout} style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.25)",
            fontSize: "12px",
            cursor: "pointer",
            letterSpacing: "0.1em",
            fontFamily: "'Cormorant', Georgia, serif",
          }}>
            Sign Out
          </button>
        </div>
      </header>

      <nav style={{
        display: "flex",
        padding: "0 clamp(20px, 5vw, 40px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        gap: "4px",
      }}>
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
              <div style={{
                ...cardBase,
                cursor: "default",
                marginBottom: "32px",
                textAlign: "center",
                padding: "36px 24px",
                background: `linear-gradient(135deg, rgba(255,255,255,0.02), ${archetype.color}08)`,
                borderColor: `${archetype.color}15`,
              }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Your Sillage
                </p>
                <h2 data-testid="text-user-archetype" style={{
                  fontFamily: "'Pinyon Script', cursive",
                  fontSize: "clamp(32px, 7vw, 48px)",
                  fontWeight: 400,
                  margin: "0 0 10px",
                  textShadow: `0 0 50px ${archetype.color}25`,
                }}>
                  {archetype.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", fontStyle: "italic", margin: "0 0 16px" }}>
                  {archetype.tagline}
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.7 }}>
                  {archetype.description}
                </p>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <p style={sectionLabel}>Recommended for You</p>
            </div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.6 }}>
              Fragrances scored for your taste profile
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recommendations.slice(0, 6).map(frag => (
                <div
                  key={frag.id}
                  data-testid={`card-recommendation-${frag.id}`}
                  onClick={() => setDetailFragrance(frag)}
                  style={cardBase}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400, lineHeight: 1.3 }}>{frag.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 8px" }}>
                        {frag.house}
                        {frag.concentration && <span style={{ color: "rgba(255,255,255,0.25)" }}> \u00B7 {frag.concentration}</span>}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                        {frag.description?.slice(0, 100)}{(frag.description?.length || 0) > 100 ? "..." : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, paddingTop: "2px" }}>
                      <span data-testid={`text-match-score-${frag.id}`} style={{
                        fontSize: "24px",
                        fontWeight: 300,
                        color: frag.matchScore >= 70 ? "rgba(180,220,180,0.85)" : frag.matchScore >= 50 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
                      }}>
                        {frag.matchScore}%
                      </span>
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", margin: "3px 0 0", letterSpacing: "0.15em", textTransform: "uppercase" }}>match</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {!vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-add-vault-${frag.id}`}
                        onClick={e => { e.stopPropagation(); addToVault.mutate(frag.id); }}
                        style={actionBtn(true)}>
                        + Vault
                      </button>
                    )}
                    {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-add-try-${frag.id}`}
                        onClick={e => { e.stopPropagation(); addToTry.mutate({ fragranceId: frag.id, priority: "curious" }); }}
                        style={actionBtn()}>
                        + To Try
                      </button>
                    )}
                    {(vaultFragIds.has(frag.id) || toTryFragIds.has(frag.id)) && (
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase", alignSelf: "center" }}>
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
          <div data-testid="tab-content-vault" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <p style={sectionLabel}>My Vault</p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", margin: "-12px 0 0" }}>
                  {vaultItems.length} {vaultItems.length === 1 ? "fragrance" : "fragrances"}
                </p>
              </div>
              <button data-testid="button-add-to-vault" onClick={() => setShowAddModal(true)} style={actionBtn(true)}>
                + Add
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "16px", marginBottom: "10px", lineHeight: 1.5 }}>
                  Your vault is empty
                </p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto" }}>
                  Add fragrances from Discover or your recommendations to start building your collection.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {vaultItems.map(item => (
                  <div
                    key={item.id}
                    data-testid={`card-vault-${item.id}`}
                    onClick={() => setEditingVaultItem(item)}
                    style={cardBase}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400 }}>{item.fragrance?.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 8px" }}>
                          {item.fragrance?.house}
                          {item.fragrance?.concentration && <span style={{ color: "rgba(255,255,255,0.25)" }}> \u00B7 {item.fragrance.concentration}</span>}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                          {item.rating ? (
                            <span style={{ fontSize: "13px", color: "rgba(212,175,55,0.7)" }}>
                              {"\u2605".repeat(item.rating)}<span style={{ color: "rgba(255,255,255,0.1)" }}>{"\u2606".repeat(5 - item.rating)}</span>
                            </span>
                          ) : null}
                          {item.matchScore ? (
                            <span style={{ fontSize: "12px", color: "rgba(180,220,180,0.5)" }}>
                              {Math.round(item.matchScore)}% match
                            </span>
                          ) : null}
                          {item.bottleSize && (
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>{item.bottleSize}</span>
                          )}
                          {item.wearFrequency && (
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>{item.wearFrequency}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                            "{item.notes.slice(0, 80)}{item.notes.length > 80 ? "..." : ""}"
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                        {item.fillLevel !== null && item.fillLevel !== undefined && item.fillLevel < 100 && (
                          <div style={{ width: "4px", height: "32px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                            <div style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: `${item.fillLevel}%`,
                              background: "rgba(255,255,255,0.25)",
                              borderRadius: "2px",
                            }} />
                          </div>
                        )}
                        <button
                          data-testid={`button-details-vault-${item.id}`}
                          onClick={e => { e.stopPropagation(); if (item.fragrance) setDetailFragrance(item.fragrance); }}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "11px",
                            cursor: "pointer",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            letterSpacing: "0.04em",
                            fontFamily: "'Cormorant', Georgia, serif",
                          }}
                        >
                          Details
                        </button>
                        <button
                          data-testid={`button-remove-vault-${item.id}`}
                          onClick={e => { e.stopPropagation(); removeFromVault.mutate(item.id); }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.15)",
                            fontSize: "18px",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          \u00D7
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "discover" && (
          <div data-testid="tab-content-discover" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <p style={{ ...sectionLabel, marginBottom: "16px" }}>Discover</p>
            <div style={{ marginBottom: "24px" }}>
              <input
                data-testid="input-search-fragrances"
                type="text"
                placeholder="Search by name, house, or family..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "15px",
                  fontFamily: "'Cormorant', Georgia, serif",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {!searchQuery.trim() && (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", marginBottom: "20px" }}>
                Showing your top matches. Search to find specific fragrances.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(searchQuery.trim() ? searchResults : recommendations).map(frag => (
                <div
                  key={frag.id}
                  data-testid={`card-discover-${frag.id}`}
                  onClick={() => setDetailFragrance(frag as any)}
                  style={cardBase}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400 }}>{frag.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 6px" }}>
                        {frag.house}
                        {frag.concentration && <span style={{ color: "rgba(255,255,255,0.25)" }}> \u00B7 {frag.concentration}</span>}
                      </p>
                      {frag.family && (
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          fontSize: "10px",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: "20px",
                          color: "rgba(255,255,255,0.35)",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}>
                          {frag.family}
                        </span>
                      )}
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "4px 0 0", lineHeight: 1.6 }}>
                        {frag.description?.slice(0, 120)}{(frag.description?.length || 0) > 120 ? "..." : ""}
                      </p>
                    </div>
                    {"matchScore" in frag && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{
                          fontSize: "22px",
                          fontWeight: 300,
                          color: (frag as any).matchScore >= 70 ? "rgba(180,220,180,0.85)" : "rgba(255,255,255,0.5)",
                        }}>
                          {(frag as any).matchScore}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {!vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-vault-${frag.id}`}
                        onClick={e => { e.stopPropagation(); addToVault.mutate(frag.id); }}
                        disabled={addToVault.isPending}
                        style={actionBtn(true)}>
                        + Vault
                      </button>
                    )}
                    {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-try-${frag.id}`}
                        onClick={e => { e.stopPropagation(); addToTry.mutate({ fragranceId: frag.id, priority: "curious" }); }}
                        disabled={addToTry.isPending}
                        style={actionBtn()}>
                        + To Try
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "to-try" && (
          <div data-testid="tab-content-to-try" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <p style={sectionLabel}>
              To Try \u00B7 {toTryItems.length}
            </p>

            {toTryItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "16px", marginBottom: "10px", lineHeight: 1.5 }}>
                  Nothing on your list yet
                </p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto" }}>
                  Browse your recommendations and add fragrances you want to sample.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {toTryItems.map(item => (
                  <div
                    key={item.id}
                    data-testid={`card-try-${item.id}`}
                    onClick={() => item.fragrance && setDetailFragrance({ ...item.fragrance, matchScore: item.matchScore ?? undefined } as any)}
                    style={cardBase}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "18px", margin: "0 0 3px", fontWeight: 400 }}>{item.fragrance?.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 8px" }}>
                          {item.fragrance?.house}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                          {item.matchScore ? (
                            <span style={{ fontSize: "12px", color: "rgba(180,220,180,0.5)" }}>
                              {Math.round(item.matchScore)}% match
                            </span>
                          ) : null}
                          <div style={{ display: "flex", gap: "4px" }}>
                            {PRIORITIES.map(p => (
                              <button
                                key={p.value}
                                data-testid={`button-priority-${p.value}-${item.id}`}
                                onClick={e => { e.stopPropagation(); updateToTryPriority.mutate({ id: item.id, priority: p.value }); }}
                                style={{
                                  padding: "3px 10px",
                                  background: item.priority === p.value ? "rgba(255,255,255,0.08)" : "transparent",
                                  border: `1px solid ${item.priority === p.value ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                                  borderRadius: "20px",
                                  color: item.priority === p.value ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)",
                                  fontSize: "10px",
                                  letterSpacing: "0.1em",
                                  cursor: "pointer",
                                  fontFamily: "'Cormorant', Georgia, serif",
                                  textTransform: "uppercase",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                        {!vaultFragIds.has(item.fragranceId) && (
                          <button data-testid={`button-try-to-vault-${item.id}`}
                            onClick={e => { e.stopPropagation(); addToVault.mutate(item.fragranceId); removeFromToTry.mutate(item.id); }}
                            style={actionBtn(true)}>
                            Own it
                          </button>
                        )}
                        <button data-testid={`button-remove-try-${item.id}`}
                          onClick={e => { e.stopPropagation(); removeFromToTry.mutate(item.id); }}
                          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.15)", fontSize: "18px", cursor: "pointer", padding: "4px" }}>
                          \u00D7
                        </button>
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
        <div data-testid="add-modal-overlay" onClick={() => { setShowAddModal(false); setSearchQuery(""); }} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "520px", maxHeight: "75vh",
            background: "#0a0a0a", borderRadius: "16px 16px 0 0",
            padding: "28px", overflow: "auto",
            border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Add to Vault
              </h3>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(""); }} style={{
                background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "22px", cursor: "pointer",
              }}>\u00D7</button>
            </div>
            <input
              data-testid="input-modal-search"
              type="text"
              placeholder="Search fragrances..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "14px 18px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px", color: "#fff", fontSize: "15px",
                fontFamily: "'Cormorant', Georgia, serif", outline: "none",
                boxSizing: "border-box", marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {searchResults.filter(f => !vaultFragIds.has(f.id)).map(frag => (
                <div key={frag.id}
                  data-testid={`card-modal-frag-${frag.id}`}
                  onClick={() => addToVault.mutate(frag.id)}
                  style={{
                    ...cardBase, display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                  <div>
                    <p style={{ fontSize: "16px", margin: "0 0 3px" }}>{frag.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>{frag.house}</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "20px" }}>+</span>
                </div>
              ))}
              {searchQuery.trim().length > 1 && searchResults.filter(f => !vaultFragIds.has(f.id)).length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "14px", textAlign: "center", padding: "24px" }}>
                  No results found
                </p>
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
        />
      )}

      {editingVaultItem && (
        <VaultEditPanel
          item={editingVaultItem}
          fragrance={editingVaultItem.fragrance}
          onClose={() => setEditingVaultItem(null)}
          onSave={(updates) => updateVaultItem.mutate({ id: editingVaultItem.id, updates })}
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
        body { margin: 0; background: #000 !important; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 0; background: transparent; }
        * { scrollbar-width: none; }
        select option { background: #111; color: #fff; }
      `}</style>
    </div>
  );
}
