import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getStoredUser, storeUser, clearUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ARCHETYPES, type ArchetypeId, type Fragrance, FAMILY_COLORS } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = getStoredUser();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!user) setLocation("/access");
  }, [user, setLocation]);

  if (!user) return null;

  const archetype = user.archetypeId ? ARCHETYPES[user.archetypeId as ArchetypeId] : null;

  const { data: vaultItems = [] } = useQuery<any[]>({
    queryKey: ["/api/users", user.id, "vault"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user.id}/vault`);
      return res.json();
    },
  });

  const { data: wearLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/users", user.id, "wear-logs"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user.id}/wear-logs`);
      return res.json();
    },
  });

  const isDark = theme === "dark";
  const bg = isDark ? "#000" : "#FFF8F5";
  const fg = isDark ? "#fff" : "#1a1a1a";
  const fgSoft = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const fgMuted = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthLogs = wearLogs.filter((log: any) => {
    const d = new Date(log.wornAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const dayMap = new Map<number, any[]>();
  monthLogs.forEach((log: any) => {
    const day = new Date(log.wornAt).getDate();
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(log);
  });

  const mostWornMap = new Map<string, number>();
  wearLogs.forEach((log: any) => {
    const name = log.fragrance?.name || "Unknown";
    mostWornMap.set(name, (mostWornMap.get(name) || 0) + 1);
  });
  const mostWorn = [...mostWornMap.entries()].sort((a, b) => b[1] - a[1])[0];

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dayNum = checkDate.getDate();
    const monthNum = checkDate.getMonth();
    const yearNum = checkDate.getFullYear();
    const hasLog = wearLogs.some((log: any) => {
      const d = new Date(log.wornAt);
      return d.getDate() === dayNum && d.getMonth() === monthNum && d.getFullYear() === yearNum;
    });
    if (hasLog) streak++;
    else if (i > 0) break;
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleRetakeQuiz = () => {
    setLocation("/quiz?retake=true");
  };

  const handleLogout = () => {
    clearUser();
    setLocation("/");
  };

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: fg,
      fontFamily: "'Cormorant', Georgia, serif",
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <button
            data-testid="button-back-dashboard"
            onClick={() => setLocation("/dashboard")}
            style={{ background: "none", border: "none", color: fgSoft, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}
          >
            Back
          </button>
          <h1 style={{ fontSize: "24px", fontWeight: 300, fontFamily: "'Pinyon Script', cursive", margin: 0 }}>Profile</h1>
          <div style={{ width: "40px" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: archetype ? `${archetype.color}40` : cardBg,
            border: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: "28px", fontFamily: "'Pinyon Script', cursive",
            color: archetype ? archetype.color : fg,
          }}>
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </div>
          <h2 data-testid="text-username" style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 4px" }}>
            {user.displayName || user.username}
          </h2>
          <p style={{ color: fgSoft, fontSize: "14px", margin: "0 0 8px" }}>@{user.username}</p>
          {archetype && (
            <span data-testid="text-archetype" style={{
              display: "inline-block", padding: "4px 16px",
              background: `${archetype.color}20`,
              border: `1px solid ${archetype.color}40`,
              borderRadius: "20px", fontSize: "13px",
              color: isDark ? archetype.color : archetype.color,
              letterSpacing: "0.05em",
            }}>
              {archetype.name}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          {[
            { label: "Vault", value: vaultItems.length },
            { label: "Wears", value: wearLogs.length },
            { label: "Streak", value: `${streak}d` },
          ].map(stat => (
            <div key={stat.label} style={{
              background: cardBg, border: `1px solid ${borderColor}`,
              borderRadius: "8px", padding: "16px", textAlign: "center",
            }}>
              <p style={{ fontSize: "24px", fontWeight: 300, margin: "0 0 4px" }}>{stat.value}</p>
              <p style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: fgSoft, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", background: cardBg, border: `1px solid ${borderColor}`,
          borderRadius: "8px", marginBottom: "12px",
        }}>
          <div>
            <p style={{ fontSize: "15px", margin: "0 0 2px" }}>Theme</p>
            <p style={{ fontSize: "12px", color: fgSoft, margin: 0 }}>{isDark ? "Dark mode" : "Light mode"}</p>
          </div>
          <button
            data-testid="button-toggle-theme"
            onClick={toggle}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s",
            }}
          >
            <div style={{
              width: "20px", height: "20px", borderRadius: "50%",
              background: isDark ? "#fff" : "#1a1a1a",
              position: "absolute", top: "3px",
              left: isDark ? "25px" : "3px",
              transition: "left 0.3s",
            }} />
          </button>
        </div>

        <button
          data-testid="button-retake-quiz"
          onClick={handleRetakeQuiz}
          style={{
            width: "100%", padding: "16px 20px", background: cardBg,
            border: `1px solid ${borderColor}`, borderRadius: "8px",
            color: fg, cursor: "pointer", fontSize: "15px",
            fontFamily: "inherit", textAlign: "left", marginBottom: "12px",
          }}
        >
          Retake Scent Quiz
        </button>

        <div style={{ marginTop: "32px", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 300, marginBottom: "20px" }}>
            Wear Journal — {monthNames[currentMonth]}
          </h3>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{
              background: cardBg, border: `1px solid ${borderColor}`,
              borderRadius: "8px", padding: "12px 16px", flex: 1, minWidth: "140px",
            }}>
              <p style={{ fontSize: "20px", fontWeight: 300, margin: "0 0 2px" }}>{monthLogs.length}</p>
              <p style={{ fontSize: "11px", color: fgSoft, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>wears this month</p>
            </div>
            {mostWorn && (
              <div style={{
                background: cardBg, border: `1px solid ${borderColor}`,
                borderRadius: "8px", padding: "12px 16px", flex: 1, minWidth: "140px",
              }}>
                <p style={{ fontSize: "14px", fontWeight: 400, margin: "0 0 2px" }}>{mostWorn[0]}</p>
                <p style={{ fontSize: "11px", color: fgSoft, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>most worn ({mostWorn[1]}x)</p>
              </div>
            )}
          </div>

          <div style={{
            background: cardBg, border: `1px solid ${borderColor}`,
            borderRadius: "8px", padding: "16px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
              {dayLabels.map(d => (
                <div key={d} style={{ fontSize: "10px", color: fgMuted, padding: "4px 0", letterSpacing: "0.1em" }}>{d}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const logsForDay = dayMap.get(day) || [];
                const hasWear = logsForDay.length > 0;
                const family = logsForDay[0]?.fragrance?.family;
                const color = family ? (FAMILY_COLORS[family] || archetype?.color || "#888") : "transparent";
                const isToday = day === now.getDate();

                return (
                  <div
                    key={day}
                    data-testid={`calendar-day-${day}`}
                    title={hasWear ? `${logsForDay.length} wear(s): ${logsForDay.map((l: any) => l.fragrance?.name).join(", ")}` : ""}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: "4px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px",
                      background: hasWear ? `${color}30` : "transparent",
                      border: isToday ? `1px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}` : `1px solid transparent`,
                      color: hasWear ? (isDark ? "#fff" : "#1a1a1a") : fgMuted,
                      position: "relative",
                    }}
                  >
                    {day}
                    {hasWear && (
                      <div style={{
                        position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)",
                        width: "4px", height: "4px", borderRadius: "50%",
                        background: color,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {wearLogs.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 300, marginBottom: "12px" }}>Recent Wears</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {wearLogs.slice(0, 10).map((log: any) => {
                const family = log.fragrance?.family;
                const color = family ? (FAMILY_COLORS[family] || "#888") : "#888";
                return (
                  <div key={log.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", background: cardBg,
                    border: `1px solid ${borderColor}`, borderRadius: "8px",
                  }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", margin: "0 0 2px" }}>{log.fragrance?.name || "Unknown"}</p>
                      <p style={{ fontSize: "11px", color: fgSoft, margin: 0 }}>
                        {log.occasion && `${log.occasion} \u00B7 `}
                        {new Date(log.wornAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: "16px", paddingTop: "24px", borderTop: `1px solid ${borderColor}` }}>
          <p style={{ fontSize: "11px", color: fgMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently"}
          </p>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            style={{
              background: "none", border: `1px solid ${isDark ? "rgba(200,60,60,0.3)" : "rgba(200,60,60,0.3)"}`,
              color: isDark ? "rgba(200,100,100,0.8)" : "rgba(180,60,60,0.8)",
              padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
              fontSize: "14px", fontFamily: "inherit",
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
