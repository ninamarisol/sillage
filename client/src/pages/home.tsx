import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";

const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;
const HEADLINE_THRESHOLD = 0.6;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const totalFramesRef = useRef(0);
  const isHoldingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [, setLocation] = useLocation();

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const totalFrames = totalFramesRef.current;
    const clampedIndex = Math.max(0, Math.min(frameIndex, totalFrames - 1));
    const img = imagesRef.current[clampedIndex];
    if (!img || !img.complete) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = window.innerWidth;
    const displayH = window.innerHeight;

    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      canvas.style.width = displayW + "px";
      canvas.style.height = displayH + "px";
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, displayW, displayH);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, displayW, displayH);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = displayW / displayH;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (imgAspect > canvasAspect) {
      drawH = displayH;
      drawW = displayH * imgAspect;
    } else {
      drawW = displayW;
      drawH = displayW / imgAspect;
    }

    drawX = (displayW - drawW) / 2;
    drawY = (displayH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  const startPlayback = useCallback(() => {
    if (intervalRef.current) return;
    isHoldingRef.current = true;
    setIsHolding(true);

    intervalRef.current = setInterval(() => {
      const totalFrames = totalFramesRef.current;
      if (currentFrameRef.current < totalFrames - 1) {
        currentFrameRef.current++;
        setCurrentFrame(currentFrameRef.current);
        drawFrame(currentFrameRef.current);
      } else {
        stopPlayback();
      }
    }, FRAME_INTERVAL);
  }, [drawFrame]);

  const stopPlayback = useCallback(() => {
    isHoldingRef.current = false;
    setIsHolding(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const fetchAndLoad = async () => {
      try {
        const res = await fetch("/api/frames");
        if (!res.ok) throw new Error("Failed to fetch frame list");
        const data = await res.json();
        const framePaths: string[] = data.frames;
        const totalFrames = data.total;
        totalFramesRef.current = totalFrames;

        let loadedCount = 0;
        const images: HTMLImageElement[] = new Array(totalFrames);

        const loadImage = (index: number): Promise<void> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              loadedCount++;
              setLoadingProgress(Math.floor((loadedCount / totalFrames) * 100));
              resolve();
            };
            img.onerror = () => {
              loadedCount++;
              setLoadingProgress(Math.floor((loadedCount / totalFrames) * 100));
              resolve();
            };
            img.src = framePaths[index];
            images[index] = img;
          });
        };

        const batchSize = 10;
        for (let i = 0; i < totalFrames; i += batchSize) {
          const batch = [];
          for (let j = i; j < Math.min(i + batchSize, totalFrames); j++) {
            batch.push(loadImage(j));
          }
          await Promise.all(batch);
        }

        imagesRef.current = images;
        setIsLoaded(true);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load frames");
      }
    };

    fetchAndLoad();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    drawFrame(0);

    const handleResize = () => {
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoaded, drawFrame]);

  const progress = totalFramesRef.current > 0 ? currentFrame / (totalFramesRef.current - 1) : 0;
  const showHeadline = progress >= HEADLINE_THRESHOLD;
  const headlineOpacity = showHeadline
    ? Math.min((progress - HEADLINE_THRESHOLD) / 0.12, 1)
    : 0;
  const atEnd = totalFramesRef.current > 0 && currentFrame >= totalFramesRef.current - 1;

  useEffect(() => {
    if (atEnd) {
      const timer = setTimeout(() => setShowEnter(true), 800);
      return () => clearTimeout(timer);
    }
  }, [atEnd]);

  if (loadError) {
    return (
      <div
        data-testid="error-screen"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "'Cormorant', Georgia, serif",
          fontSize: "14px",
          letterSpacing: "0.1em",
        }}
      >
        {loadError}
      </div>
    );
  }

  return (
    <div
      data-testid="main-container"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {!isLoaded && (
        <div
          data-testid="loading-screen"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
          }}
        >
          <div style={{ width: "200px", marginBottom: "16px" }}>
            <div
              style={{
                width: "100%",
                height: "2px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "1px",
                overflow: "hidden",
              }}
            >
              <div
                data-testid="loading-bar"
                style={{
                  height: "100%",
                  width: `${loadingProgress}%`,
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "1px",
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
          </div>
          <span
            data-testid="loading-text"
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontFamily: "'Cormorant', Georgia, serif",
            }}
          >
            {loadingProgress}%
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        data-testid="animation-canvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "block",
          background: "#000000",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.8s ease-in-out",
        }}
      />

      <div
        data-testid="headline-sillage"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          opacity: headlineOpacity,
          transform: `translateY(${(1 - headlineOpacity) * 40}px)`,
          transition: "opacity 1.2s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              color: "#ffffff",
              fontFamily: "'Pinyon Script', cursive",
              fontWeight: 400,
              fontSize: "clamp(64px, 18vw, 220px)",
              letterSpacing: "0.02em",
              margin: 0,
              textShadow: "0 4px 80px rgba(0,0,0,0.6), 0 0 120px rgba(0,0,0,0.3)",
              lineHeight: 1,
            }}
          >
            Sillage
          </h1>
          {showEnter && (
            <button
              data-testid="button-enter-sillage"
              onClick={() => setLocation("/access")}
              style={{
                marginTop: "32px",
                padding: "14px 40px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.7)",
                fontSize: "12px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Cormorant', Georgia, serif",
                pointerEvents: "auto",
                animation: "fadeIn 1.2s ease-out",
                transition: "background 0.3s ease, border-color 0.3s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
            >
              Enter Sillage
            </button>
          )}
        </div>
      </div>

      {isLoaded && !atEnd && (
        <div
          data-testid="hold-button-container"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(calc(-50% + 8vw), calc(-50% - 18vh))",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            data-testid="hold-button"
            onMouseDown={startPlayback}
            onMouseUp={stopPlayback}
            onMouseLeave={stopPlayback}
            onTouchStart={(e) => { e.preventDefault(); startPlayback(); }}
            onTouchEnd={stopPlayback}
            onTouchCancel={stopPlayback}
            style={{
              width: "clamp(48px, 8vw, 72px)",
              height: "clamp(48px, 8vw, 72px)",
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.2)",
              background: isHolding ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s ease, border-color 0.3s ease, transform 0.2s ease",
              animation: isHolding ? "none" : "buttonPulse 2.5s ease-in-out infinite",
              transform: isHolding ? "scale(0.9)" : "scale(1)",
              outline: "none",
              padding: 0,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                width: "clamp(16px, 3vw, 24px)",
                height: "clamp(16px, 3vw, 24px)",
                borderRadius: "50%",
                background: isHolding
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(255,255,255,0.15)",
                transition: "background 0.3s ease, transform 0.2s ease",
                transform: isHolding ? "scale(0.8)" : "scale(1)",
              }}
            />
          </button>
          <span
            data-testid="hold-label"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "'Cormorant', Georgia, serif",
              opacity: isHolding ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            Hold
          </span>
        </div>
      )}

      <style>{`
        @keyframes buttonPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.2);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(255,255,255,0);
            border-color: rgba(255,255,255,0.35);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        body {
          margin: 0;
          padding: 0;
          background: #000000 !important;
          overflow: hidden;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}
