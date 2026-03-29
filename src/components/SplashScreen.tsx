import React, { useState, useEffect } from 'react';

const SPLASH_DURATION = 3500; // 3.5 seconds
const SKIP_KEY = 'splash_shown';

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [visible, setVisible] = useState(() => {
    // Skip splash if already shown in this session
    return !sessionStorage.getItem(SKIP_KEY);
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fadeTimer = setTimeout(() => setFading(true), SPLASH_DURATION - 600);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SKIP_KEY, '1');
    }, SPLASH_DURATION);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [visible]);

  return (
    <>
      {/* Splash overlay */}
      {visible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#050914',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'all',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
          {/* Ambient glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Content */}
          <div style={{
            animation: 'splashPop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            zIndex: 10,
          }}>
            {/* Logo Icon */}
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 24, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40,
              boxShadow: '0 0 60px rgba(99,102,241,0.5)',
            }}>⚡</div>

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800, color: '#f8fafc',
                letterSpacing: -0.5, margin: 0, marginBottom: 4,
              }}>TREVOROS</h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 14, color: '#64748b', margin: 0, marginTop: 6,
                letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: 500,
              }}>MVP</p>
            </div>

            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '50%',
                  animation: `splashBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>

          {/* Social Links Footer */}
          <div style={{
            position: 'absolute', bottom: 32, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 20, zIndex: 10,
          }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              title="Instagram"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8', textDecoration: 'none', fontSize: 16,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
              }}
            >📷</a>

            <a href="https://x.com" target="_blank" rel="noopener noreferrer"
              title="X (Twitter)"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8', textDecoration: 'none', fontSize: 16,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
              }}
            >𝕏</a>

            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              title="LinkedIn"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8', textDecoration: 'none', fontSize: 16,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
              }}
            >💼</a>
          </div>

          {/* Progress bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            background: 'rgba(255,255,255,0.05)',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              animation: `splashProgress ${SPLASH_DURATION}ms linear forwards`,
            }} />
          </div>

          <style>{`
            @keyframes splashPop {
              from { opacity: 0; transform: scale(0.8) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes splashBounce {
              0%, 80%, 100% { transform: translateY(0) scaleY(1); }
              40% { transform: translateY(-12px) scaleY(1.1); }
            }
            @keyframes splashProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* App content — always mounted but pointer-events blocked during splash */}
      <div style={{ pointerEvents: visible ? 'none' : 'all' }}>
        {children}
      </div>
    </>
  );
}