import { useEffect, useRef, useState, useCallback } from 'react';
import './HoldingPage.css';
import SplashScreen from '../components/reDesignDashboard/SplashScreen';

// ─── 3D Orb Particle ───
interface OrbParticle {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  size: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

// ─── Floating Background Particle ───
interface BGParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

export default function HoldingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [showSplash, setShowSplash] = useState(true);
  const [introExiting, setIntroExiting] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // ─── Transition sequence from Splash to Cinematic Main Page ───
  useEffect(() => {
    if (!showSplash) {
      const exitTimer = setTimeout(() => {
        setIntroExiting(true);
      }, 1200);

      const completeTimer = setTimeout(() => {
        setIntroComplete(true);
      }, 2000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [showSplash]);

  // ─── Canvas: 3D Orb + Background Particles ───
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Create 3D orb particles (sphere distribution) ──
    const ORBS_COUNT = width < 768 ? 180 : 350;
    const ORB_RADIUS = Math.min(width, height) * (width < 768 ? 0.22 : 0.18);
    const orbParticles: OrbParticle[] = [];

    for (let i = 0; i < ORBS_COUNT; i++) {
      // Fibonacci sphere for even distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / ORBS_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = ORB_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = ORB_RADIUS * Math.sin(phi) * Math.sin(theta);
      const z = ORB_RADIUS * Math.cos(phi);

      orbParticles.push({
        x, y, z,
        ox: x, oy: y, oz: z,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    // ── Create floating background particles ──
    const BG_COUNT = width < 768 ? 40 : 80;
    const bgParticles: BGParticle[] = [];

    for (let i = 0; i < BG_COUNT; i++) {
      bgParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.01 + 0.005,
      });
    }

    let rotation = 0;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.01;
      rotation += 0.003;

      // ── Draw background particles ──
      for (const p of bgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const alpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 194, 254, ${alpha})`;
        ctx.fill();
      }

      // ── 3D Orb ──
      const cx = width / 2;
      const cy = height / 2;
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const cosT = Math.cos(rotation * 0.7);
      const sinT = Math.sin(rotation * 0.7);

      // Project & sort particles by z-depth
      const projected: { sx: number; sy: number; sz: number; size: number; alpha: number; i: number }[] = [];

      for (let i = 0; i < orbParticles.length; i++) {
        const p = orbParticles[i];

        // Subtle breathing
        const breathe = 1 + 0.03 * Math.sin(time * 2 + p.pulse);
        let x = p.ox * breathe;
        let y = p.oy * breathe;
        let z = p.oz * breathe;

        // Rotate Y-axis
        const x1 = x * cosR + z * sinR;
        const z1 = -x * sinR + z * cosR;
        // Rotate X-axis slightly
        const y1 = y * cosT - z1 * sinT;
        const z2 = y * sinT + z1 * cosT;

        // Perspective projection
        const perspective = 600;
        const scale = perspective / (perspective + z2);
        const sx = cx + x1 * scale;
        const sy = cy + y1 * scale;

        p.pulse += p.pulseSpeed;
        const pulseAlpha = 0.4 + 0.6 * Math.sin(p.pulse);

        projected.push({
          sx, sy, sz: z2,
          size: p.size * scale * 1.5,
          alpha: p.alpha * pulseAlpha * scale,
          i,
        });
      }

      // Sort back-to-front
      projected.sort((a, b) => a.sz - b.sz);

      // Draw connections (only between nearby particles)
      const CONNECTION_DIST = ORB_RADIUS * 0.35;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12 *
              Math.min(projected[i].alpha, projected[j].alpha);
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.strokeStyle = `rgba(0, 194, 254, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw orb particles
      for (const p of projected) {
        // Glow
        const gradient = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, p.size * 4);
        gradient.addColorStop(0, `rgba(0, 194, 254, ${p.alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(0, 102, 255, ${p.alpha * 0.1})`);
        gradient.addColorStop(1, 'rgba(0, 194, 254, 0)');
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 230, 255, ${p.alpha * 0.9})`;
        ctx.fill();
      }

      // ── Central glow behind the orb ──
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, ORB_RADIUS * 1.3);
      coreGlow.addColorStop(0, 'rgba(0, 194, 254, 0.04)');
      coreGlow.addColorStop(0.4, 'rgba(0, 102, 255, 0.02)');
      coreGlow.addColorStop(0.7, 'rgba(107, 0, 255, 0.01)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, ORB_RADIUS * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  return (
    <div className="holding-page" id="holding-page">
      {/* ── Previous Splash Screen ── */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* ── Cinematic Intro ── */}
      {!showSplash && !introComplete && (
        <div className={`intro-overlay ${introExiting ? 'exiting' : ''}`} id="intro-overlay">
          <div className="intro-scanlines" />
          <div className="intro-grid" />
          <div
            className="intro-glitch-text"
            data-text="TREVOROS"
          >
            TREVOROS
          </div>
        </div>
      )}

      {/* ── Background Layers ── */}
      <div className="bg-gradient" />
      <div className="perspective-grid" />
      <div className="noise-overlay" />

      {/* ── Light Streaks ── */}
      <div className="light-streaks">
        <div className="light-streak" />
        <div className="light-streak" />
        <div className="light-streak" />
        <div className="light-streak" />
        <div className="light-streak" />
      </div>

      {/* ── 3D Orb Canvas ── */}
      <canvas ref={canvasRef} className="orb-canvas" id="orb-canvas" />

      {/* ── Vignette ── */}
      <div className="vignette" />

      {/* ── Main Content ── */}
      <main className={`content-layer ${introComplete ? 'revealed' : ''}`} id="content-layer">
        {/* Brand badge */}
        <div className="brand-badge" id="brand-badge">
          <span className="badge-dot" />
          <span className="badge-text">WEBSITE UNDER MAINTENANCE</span>
        </div>

        {/* Hero */}
        <h1 className="hero-headline" id="hero-headline" style={{ maxWidth: '850px' }}>
          The MVP is live and your feedback has been incredibly valuable.
        </h1>

        {/* Subheadline */}
        <p className="sub-headline" id="sub-headline" style={{ maxWidth: '650px' }}>
          We’re now rebuilding the platform experience to deliver something faster, smarter, and more powerful.
        </p>

        {/* Status tagline */}
        <div className="tagline-container" id="tagline-container" style={{ height: 'auto', marginBottom: '2.5rem' }}>
          <div className="tagline active" style={{ position: 'relative', fontSize: '1.4rem', fontWeight: 600 }}>
            Final Product Loading...
          </div>
        </div>

        {/* Divider */}
        <div className="divider" />
      </main>

      {/* ── Footer ── */}
      <footer className={`holding-footer ${introComplete ? 'revealed' : ''}`} id="holding-footer">
        <div className="footer-brand" style={{ fontSize: '0.95rem', color: 'rgba(240, 240, 245, 0.65)', fontWeight: 400 }}>
          Thank you for being part of the early journey.
        </div>
      </footer>
    </div>
  );
}
