import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ARCHETYPES, type ArchetypeId, type Fragrance } from "@shared/schema";

interface FeedPostData {
  id: string;
  userId: string;
  type: string;
  content: string | null;
  fragranceId: string | null;
  rating: number | null;
  likeCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null; archetypeId: string | null } | null;
  fragrance: Fragrance | null;
  liked: boolean;
}

export default function Feed() {
  const [, setLocation] = useLocation();
  const user = getStoredUser();
  const { theme } = useTheme();
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"review" | "recommendation">("review");
  const [selectedFragranceId, setSelectedFragranceId] = useState("");
  const [postRating, setPostRating] = useState(0);

  useEffect(() => {
    if (!user) setLocation("/access");
  }, [user, setLocation]);

  if (!user) return null;

  const isDark = theme === "dark";
  const bg = isDark ? "#000" : "#eddfd9";
  const fg = isDark ? "#fff" : "#1a1a1a";
  const fgSoft = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const fgMuted = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const { data: posts = [], isLoading } = useQuery<FeedPostData[]>({
    queryKey: ["/api/feed"],
    queryFn: async () => {
      const res = await fetch(`/api/feed?userId=${user.id}`);
      return res.json();
    },
  });

  const { data: allFragrances = [] } = useQuery<Fragrance[]>({
    queryKey: ["/api/fragrances"],
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/feed/${postId}/like`, { userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/feed", {
        userId: user.id,
        type: postType,
        content: postContent,
        fragranceId: selectedFragranceId || undefined,
        rating: postRating || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setShowPostModal(false);
      setPostContent("");
      setSelectedFragranceId("");
      setPostRating(0);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/feed/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  const typeLabels: Record<string, string> = {
    wear_log: "Wear",
    review: "Review",
    recommendation: "Rec",
  };

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: fg,
      fontFamily: "'Cormorant', Georgia, serif",
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button
            data-testid="button-back-dashboard"
            onClick={() => setLocation("/dashboard")}
            style={{ background: "none", border: "none", color: fgSoft, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}
          >
            Back
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 300, fontFamily: "'Pinyon Script', cursive", margin: 0 }}>Feed</h1>
          <button
            data-testid="button-create-post"
            onClick={() => setShowPostModal(true)}
            style={{
              background: "none", border: `1px solid ${borderColor}`,
              color: fg, cursor: "pointer", fontSize: "13px",
              fontFamily: "inherit", padding: "6px 14px", borderRadius: "4px",
            }}
          >
            Share
          </button>
        </div>

        {isLoading ? (
          <p style={{ color: fgSoft, textAlign: "center", padding: "40px 0" }}>Loading...</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ color: fgSoft, fontSize: "16px", marginBottom: "8px" }}>The feed is quiet</p>
            <p style={{ color: fgMuted, fontSize: "14px" }}>Log a wear or share a review to start the conversation.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {posts.map(post => {
              const postArch = post.user?.archetypeId ? ARCHETYPES[post.user.archetypeId as ArchetypeId] : null;
              return (
                <div
                  key={post.id}
                  data-testid={`card-post-${post.id}`}
                  style={{
                    background: cardBg, border: `1px solid ${borderColor}`,
                    borderRadius: "8px", padding: "18px 20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: postArch ? `${postArch.color}30` : cardBg,
                      border: `1px solid ${borderColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", fontFamily: "'Pinyon Script', cursive",
                      color: postArch ? postArch.color : fg,
                      flexShrink: 0,
                    }}>
                      {(post.user?.displayName || post.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 400 }}>
                          {post.user?.displayName || post.user?.username}
                        </span>
                        {postArch && (
                          <span style={{
                            fontSize: "10px", padding: "2px 8px",
                            background: `${postArch.color}15`,
                            border: `1px solid ${postArch.color}30`,
                            borderRadius: "10px", color: postArch.color,
                            letterSpacing: "0.05em",
                          }}>
                            {postArch.name}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <span style={{
                          fontSize: "10px", padding: "1px 6px",
                          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                          borderRadius: "3px", color: fgSoft, letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}>
                          {typeLabels[post.type] || post.type}
                        </span>
                        <span style={{ fontSize: "12px", color: fgMuted }}>{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    {post.userId === user.id && (
                      <button
                        data-testid={`button-delete-post-${post.id}`}
                        onClick={() => deletePost.mutate(post.id)}
                        style={{
                          background: "none", border: "none", color: fgMuted,
                          cursor: "pointer", fontSize: "16px", padding: "4px",
                        }}
                      >
                        \u00D7
                      </button>
                    )}
                  </div>

                  {post.content && (
                    <p style={{ fontSize: "15px", lineHeight: 1.7, margin: "0 0 12px", color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>
                      {post.content}
                    </p>
                  )}

                  {post.rating && (
                    <p style={{ fontSize: "14px", color: "rgba(212,175,55,0.7)", margin: "0 0 10px" }}>
                      {"\u2605".repeat(post.rating)}<span style={{ color: fgMuted }}>{"\u2606".repeat(5 - post.rating)}</span>
                    </p>
                  )}

                  {post.fragrance && (
                    <div style={{
                      padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${borderColor}`, borderRadius: "6px", marginBottom: "12px",
                    }}>
                      <p style={{ fontSize: "14px", margin: "0 0 2px", fontWeight: 400 }}>{post.fragrance.name}</p>
                      <p style={{ fontSize: "12px", color: fgSoft, margin: 0 }}>
                        {post.fragrance.house}
                        {post.fragrance.family && <span style={{ color: fgMuted }}> \u00B7 {post.fragrance.family}</span>}
                      </p>
                    </div>
                  )}

                  <button
                    data-testid={`button-like-post-${post.id}`}
                    onClick={() => likeMutation.mutate(post.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      color: post.liked ? (isDark ? "rgba(212,175,55,0.8)" : "rgba(180,140,30,0.8)") : fgMuted,
                      fontSize: "13px", padding: "4px 0", fontFamily: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "15px" }}>{post.liked ? "\u2665" : "\u2661"}</span>
                    {post.likeCount > 0 && <span>{post.likeCount}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPostModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 100,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowPostModal(false); }}>
          <div style={{
            width: "100%", maxWidth: "600px",
            background: isDark ? "#111" : "#eddfd9",
            borderRadius: "16px 16px 0 0", padding: "28px 24px 40px",
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 300, margin: 0 }}>Share</h3>
              <button onClick={() => setShowPostModal(false)} style={{ background: "none", border: "none", color: fgSoft, cursor: "pointer", fontSize: "20px" }}>\u00D7</button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {(["review", "recommendation"] as const).map(t => (
                <button
                  key={t}
                  data-testid={`button-post-type-${t}`}
                  onClick={() => setPostType(t)}
                  style={{
                    padding: "6px 16px", borderRadius: "20px",
                    background: postType === t ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : "transparent",
                    border: `1px solid ${postType === t ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)") : borderColor}`,
                    color: fg, cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <select
              data-testid="select-post-fragrance"
              value={selectedFragranceId}
              onChange={e => setSelectedFragranceId(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: "12px",
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${borderColor}`, borderRadius: "6px",
                color: fg, fontSize: "14px", fontFamily: "inherit",
              }}
            >
              <option value="">Select a fragrance (optional)</option>
              {allFragrances.map(f => (
                <option key={f.id} value={f.id}>{f.name} — {f.house}</option>
              ))}
            </select>

            <textarea
              data-testid="input-post-content"
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Share your thoughts..."
              style={{
                width: "100%", minHeight: "100px", padding: "12px",
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${borderColor}`, borderRadius: "6px",
                color: fg, fontSize: "15px", fontFamily: "inherit",
                resize: "vertical", lineHeight: 1.6,
              }}
            />

            {postType === "review" && (
              <div style={{ display: "flex", gap: "6px", margin: "12px 0" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    data-testid={`button-post-star-${star}`}
                    onClick={() => setPostRating(star === postRating ? 0 : star)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "20px", padding: "2px",
                      color: star <= postRating ? "rgba(212,175,55,0.85)" : fgMuted,
                    }}
                  >
                    {star <= postRating ? "\u2605" : "\u2606"}
                  </button>
                ))}
              </div>
            )}

            <button
              data-testid="button-submit-post"
              onClick={() => createPost.mutate()}
              disabled={!postContent.trim() || createPost.isPending}
              style={{
                width: "100%", padding: "12px", marginTop: "16px",
                background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                border: `1px solid ${borderColor}`,
                borderRadius: "6px", color: fg, cursor: "pointer",
                fontSize: "15px", fontFamily: "inherit",
                opacity: !postContent.trim() ? 0.4 : 1,
              }}
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
