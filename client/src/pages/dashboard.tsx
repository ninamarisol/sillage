import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser, clearUser } from "@/lib/auth";
import { ARCHETYPES, type ArchetypeId, type Fragrance, type VaultItem, type ToTryItem } from "@shared/schema";

type Tab = "home" | "vault" | "discover" | "to-try";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
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
      setSelectedFragrance(null);
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

  const handleLogout = () => {
    clearUser();
    setLocation("/");
  };

  const tabStyle = (t: Tab) => ({
    padding: "8px 0",
    background: "transparent",
    border: "none",
    borderBottom: activeTab === t ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
    color: activeTab === t ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
    fontSize: "11px",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "'Cormorant', Georgia, serif",
    transition: "all 0.3s ease",
    flex: 1,
  });

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    padding: "16px",
    transition: "border-color 0.3s ease",
  };

  const vaultFragIds = new Set(vaultItems.map(v => v.fragranceId));
  const toTryFragIds = new Set(toTryItems.map(t => t.fragranceId));

  return (
    <div data-testid="dashboard-page" style={{
      minHeight: "100vh", background: "#000", fontFamily: "'Cormorant', Georgia, serif",
      color: "#fff", padding: "0 0 100px",
    }}>
      <header style={{
        padding: "20px clamp(16px, 4vw, 32px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div>
          <h1 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "24px", fontWeight: 400, margin: 0 }}>
            Sillage
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
            {user.displayName || user.username}
          </span>
          <button data-testid="button-logout" onClick={handleLogout} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.25)",
            fontSize: "11px", cursor: "pointer", letterSpacing: "0.1em",
            fontFamily: "'Cormorant', Georgia, serif",
          }}>
            Sign Out
          </button>
        </div>
      </header>

      <nav style={{
        display: "flex", padding: "0 clamp(16px, 4vw, 32px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "4px",
      }}>
        {(["home", "vault", "discover", "to-try"] as Tab[]).map(t => (
          <button key={t} data-testid={`tab-${t}`} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
            {t === "to-try" ? "To Try" : t}
          </button>
        ))}
      </nav>

      <main style={{ padding: "24px clamp(16px, 4vw, 32px)", maxWidth: "720px", margin: "0 auto" }}>

        {activeTab === "home" && (
          <div data-testid="tab-content-home" style={{ animation: "fadeUp 0.5s ease-out" }}>
            {archetype && (
              <div style={{ ...cardStyle, marginBottom: "24px", textAlign: "center", padding: "28px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Your Sillage
                </p>
                <h2 data-testid="text-user-archetype" style={{
                  fontFamily: "'Pinyon Script', cursive", fontSize: "clamp(28px, 6vw, 40px)",
                  fontWeight: 400, margin: "0 0 8px", textShadow: `0 0 40px ${archetype.color}30`,
                }}>
                  {archetype.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{archetype.tagline}</p>
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                  Recommended for You
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recommendations.slice(0, 5).map(frag => (
                  <div key={frag.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "16px", margin: "0 0 2px", fontWeight: 400 }}>{frag.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 6px" }}>{frag.house}</p>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", margin: 0, lineHeight: 1.5 }}>
                          {frag.description?.slice(0, 80)}...
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span data-testid={`text-match-score-${frag.id}`} style={{
                          fontSize: "20px", fontWeight: 300,
                          color: frag.matchScore >= 70 ? "rgba(180,220,180,0.8)" : "rgba(255,255,255,0.5)",
                        }}>
                          {frag.matchScore}%
                        </span>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", margin: "2px 0 0", letterSpacing: "0.1em" }}>match</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      {!vaultFragIds.has(frag.id) && (
                        <button data-testid={`button-add-vault-${frag.id}`}
                          onClick={() => addToVault.mutate(frag.id)}
                          style={{
                            padding: "6px 14px", background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px",
                            color: "rgba(255,255,255,0.5)", fontSize: "10px", letterSpacing: "0.15em",
                            textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                          }}>
                          + Vault
                        </button>
                      )}
                      {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                        <button data-testid={`button-add-try-${frag.id}`}
                          onClick={() => addToTry.mutate({ fragranceId: frag.id, priority: "curious" })}
                          style={{
                            padding: "6px 14px", background: "transparent",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "3px",
                            color: "rgba(255,255,255,0.35)", fontSize: "10px", letterSpacing: "0.15em",
                            textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                          }}>
                          + To Try
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "vault" && (
          <div data-testid="tab-content-vault" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                My Vault ({vaultItems.length})
              </h3>
              <button data-testid="button-add-to-vault" onClick={() => setShowAddModal(true)} style={{
                padding: "8px 16px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "3px",
                color: "rgba(255,255,255,0.6)", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
              }}>
                + Add
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "8px" }}>
                  Your vault is empty
                </p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                  Add fragrances from Discover or search to build your collection
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {vaultItems.map(item => (
                  <div key={item.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "16px", margin: "0 0 2px" }}>{item.fragrance?.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 4px" }}>
                          {item.fragrance?.house} {item.fragrance?.concentration && `· ${item.fragrance.concentration}`}
                        </p>
                        {item.matchScore && (
                          <p style={{ color: "rgba(180,220,180,0.6)", fontSize: "11px", margin: 0 }}>
                            {Math.round(item.matchScore)}% match
                          </p>
                        )}
                      </div>
                      <button data-testid={`button-remove-vault-${item.id}`}
                        onClick={() => removeFromVault.mutate(item.id)}
                        style={{
                          background: "transparent", border: "none", color: "rgba(255,255,255,0.2)",
                          fontSize: "16px", cursor: "pointer", padding: "4px",
                        }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "discover" && (
          <div data-testid="tab-content-discover" style={{ animation: "fadeUp 0.5s ease-out" }}>
            <div style={{ marginBottom: "20px" }}>
              <input
                data-testid="input-search-fragrances"
                type="text"
                placeholder="Search fragrances..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px", color: "#fff", fontSize: "14px",
                  fontFamily: "'Cormorant', Georgia, serif", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(searchQuery.trim() ? searchResults : recommendations).map(frag => (
                <div key={frag.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "16px", margin: "0 0 2px" }}>{frag.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 4px" }}>
                        {frag.house} {frag.concentration && `· ${frag.concentration}`}
                      </p>
                      {frag.family && (
                        <span style={{
                          display: "inline-block", padding: "2px 8px", fontSize: "10px",
                          background: "rgba(255,255,255,0.05)", borderRadius: "3px",
                          color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase",
                        }}>
                          {frag.family}
                        </span>
                      )}
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", margin: "6px 0 0", lineHeight: 1.5 }}>
                        {frag.description?.slice(0, 100)}...
                      </p>
                    </div>
                    {"matchScore" in frag && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{
                          fontSize: "18px", fontWeight: 300,
                          color: (frag as any).matchScore >= 70 ? "rgba(180,220,180,0.8)" : "rgba(255,255,255,0.5)",
                        }}>
                          {(frag as any).matchScore}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    {!vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-vault-${frag.id}`}
                        onClick={() => addToVault.mutate(frag.id)}
                        disabled={addToVault.isPending}
                        style={{
                          padding: "6px 14px", background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px",
                          color: "rgba(255,255,255,0.5)", fontSize: "10px", letterSpacing: "0.15em",
                          textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                        }}>
                        + Vault
                      </button>
                    )}
                    {!toTryFragIds.has(frag.id) && !vaultFragIds.has(frag.id) && (
                      <button data-testid={`button-discover-try-${frag.id}`}
                        onClick={() => addToTry.mutate({ fragranceId: frag.id, priority: "curious" })}
                        disabled={addToTry.isPending}
                        style={{
                          padding: "6px 14px", background: "transparent",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "3px",
                          color: "rgba(255,255,255,0.35)", fontSize: "10px", letterSpacing: "0.15em",
                          textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                        }}>
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
            <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
              To Try ({toTryItems.length})
            </h3>

            {toTryItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "8px" }}>
                  Nothing on your list yet
                </p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                  Browse recommendations and add fragrances you'd like to try
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {toTryItems.map(item => (
                  <div key={item.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "16px", margin: "0 0 2px" }}>{item.fragrance?.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 4px" }}>
                          {item.fragrance?.house}
                        </p>
                        {item.matchScore && (
                          <p style={{ color: "rgba(180,220,180,0.6)", fontSize: "11px", margin: 0 }}>
                            {Math.round(item.matchScore)}% match
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {!vaultFragIds.has(item.fragranceId) && (
                          <button data-testid={`button-try-to-vault-${item.id}`}
                            onClick={() => {
                              addToVault.mutate(item.fragranceId);
                              removeFromToTry.mutate(item.id);
                            }}
                            style={{
                              padding: "4px 10px", background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px",
                              color: "rgba(255,255,255,0.5)", fontSize: "10px", letterSpacing: "0.1em",
                              textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cormorant', Georgia, serif",
                            }}>
                            Own it
                          </button>
                        )}
                        <button data-testid={`button-remove-try-${item.id}`}
                          onClick={() => removeFromToTry.mutate(item.id)}
                          style={{
                            background: "transparent", border: "none", color: "rgba(255,255,255,0.2)",
                            fontSize: "16px", cursor: "pointer", padding: "4px",
                          }}>
                          ×
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "520px", maxHeight: "70vh",
            background: "#0a0a0a", borderRadius: "12px 12px 0 0",
            padding: "24px", overflow: "auto",
            border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                Add to Vault
              </h3>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(""); }} style={{
                background: "transparent", border: "none", color: "rgba(255,255,255,0.3)",
                fontSize: "18px", cursor: "pointer",
              }}>×</button>
            </div>
            <input
              data-testid="input-modal-search"
              type="text"
              placeholder="Search fragrances..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px", color: "#fff", fontSize: "14px",
                fontFamily: "'Cormorant', Georgia, serif", outline: "none",
                boxSizing: "border-box", marginBottom: "12px",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {searchResults.filter(f => !vaultFragIds.has(f.id)).map(frag => (
                <div key={frag.id} onClick={() => addToVault.mutate(frag.id)} style={{
                  ...cardStyle, cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <p style={{ fontSize: "14px", margin: "0 0 2px" }}>{frag.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 }}>{frag.house}</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "18px" }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; background: #000 !important; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width: 0; background: transparent; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
