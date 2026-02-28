import { useEffect, useRef, useState, useCallback } from "react";

const SCROLL_HEIGHT_MULTIPLIER = 8;

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const targetFrameRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const totalFramesRef = useRef(0);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const startAnimationLoop = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const animate = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = Math.abs(target - current);

      if (diff > 0.3) {
        const next = current + (target - current) * 0.15;
        currentFrameRef.current = next;
        drawFrame(Math.round(next));
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentFrameRef.current = target;
        drawFrame(target);
        isAnimatingRef.current = false;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

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

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const rawProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      const easedProgress = easeInOutCubic(rawProgress);

      setScrollProgress(rawProgress);

      const totalFrames = totalFramesRef.current;
      const frameIndex = Math.min(
        Math.floor(easedProgress * (totalFrames - 1)),
        totalFrames - 1
      );
      targetFrameRef.current = frameIndex;
      startAnimationLoop();
    };

    const handleResize = () => {
      drawFrame(Math.round(currentFrameRef.current));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      isAnimatingRef.current = false;
    };
  }, [isLoaded, drawFrame, startAnimationLoop]);

  const headlineOpacity = scrollProgress >= 0.55 && scrollProgress <= 0.85
    ? Math.min((scrollProgress - 0.55) / 0.1, 1) * (1 - Math.max((scrollProgress - 0.75) / 0.1, 0))
    : 0;

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
          fontFamily: "'Playfair Display', Georgia, serif",
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
      ref={containerRef}
      data-testid="scroll-container"
      style={{
        height: isLoaded ? `${100 * SCROLL_HEIGHT_MULTIPLIER}vh` : "100vh",
        background: "#000000",
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
                background: "rgba(255,255,255,0.1)",
                borderRadius: "1px",
                overflow: "hidden",
              }}
            >
              <div
                data-testid="loading-bar"
                style={{
                  height: "100%",
                  width: `${loadingProgress}%`,
                  background: "rgba(255,255,255,0.8)",
                  borderRadius: "1px",
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
          </div>
          <span
            data-testid="loading-text"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Playfair Display', Georgia, serif",
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
        data-testid="headline-presence"
        style={{
          position: "fixed",
          bottom: "12%",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
          pointerEvents: "none",
          opacity: headlineOpacity,
          transform: `translateY(${(1 - headlineOpacity) * 20}px)`,
          transition: "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(24px, 4vw, 56px)",
            letterSpacing: "0.12em",
            margin: 0,
            textShadow: "0 2px 40px rgba(0,0,0,0.6)",
          }}
        >
          Presence.
        </h1>
      </div>

      {isLoaded && (
        <div
          data-testid="scroll-hint"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            opacity: scrollProgress < 0.05 ? 1 : 0,
            transition: "opacity 0.6s ease-out",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Scroll
          </span>
          <div
            style={{
              width: "1px",
              height: "32px",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0))",
              animation: "scrollPulse 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        
        html {
          scroll-behavior: auto !important;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: #000000 !important;
          overflow-x: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        
        * {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
