"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, TrendingUp, FileText, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const user = username.trim().toUpperCase();
    const isValidProph = user === 'PROPIEDAD HORIZONTAL' && password === '292509';
    const isValidEmdecob = user === 'EMDECOB' && password === '270227';
    const isValidTesoreria = user === 'TESORERIA' && password === '261424';
    const isValidMixto = (user === 'PORTAFOLIO MIXTO' || user === 'PM') && password === '700826';

    if (isValidProph || isValidEmdecob || isValidTesoreria || isValidMixto) {
      localStorage.setItem('currentUser', user);
      if (isValidProph) {
        localStorage.setItem('userPortafolio', 'PROPIEDAD HORIZONTAL');
      } else if (isValidMixto) {
        localStorage.setItem('userPortafolio', 'MIXTO');
      } else {
        localStorage.setItem('userPortafolio', 'Todos');
      }
      setTimeout(() => {
        router.push('/dashboard/upload');
      }, 800);
    } else {
      setTimeout(() => {
        setError('Usuario o contraseña incorrectos');
        setIsLoading(false);
      }, 800);
    }
  };

  const features = [
    { icon: FileText,    label: 'Generación Automática', desc: 'Cuentas de cobro al instante' },
    { icon: TrendingUp,  label: 'Gestión de Recaudos',   desc: 'Control total de cartera' },
    { icon: ShieldCheck, label: 'Acceso Seguro',          desc: 'Roles y permisos por usuario' },
    { icon: Zap,         label: 'Multi-Portafolio',       desc: 'PH, Mixto y más carteras' },
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(180deg) translateX(80px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(80px) rotate(-540deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dash-move {
          to { stroke-dashoffset: -200; }
        }
        .anim-slide-up { animation: slide-up 0.7s ease-out forwards; opacity: 0; }
        .anim-slide-up-d1 { animation: slide-up 0.7s ease-out 0.1s forwards; opacity: 0; }
        .anim-slide-up-d2 { animation: slide-up 0.7s ease-out 0.2s forwards; opacity: 0; }
        .anim-slide-up-d3 { animation: slide-up 0.7s ease-out 0.3s forwards; opacity: 0; }
        .anim-slide-up-d4 { animation: slide-up 0.7s ease-out 0.4s forwards; opacity: 0; }
        .anim-fade { animation: fade-in 1s ease-out forwards; opacity: 0; }

        .mesh-bg {
          background: linear-gradient(135deg, #0a0f1e 0%, #0d1f2d 30%, #0a2218 60%, #071a12 100%);
        }
        .glow-orb-1 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation: float-slow 8s ease-in-out infinite;
        }
        .glow-orb-2 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%);
          bottom: -80px; right: 60px;
          animation: float-medium 10s ease-in-out infinite;
        }
        .glow-orb-3 {
          position: absolute;
          width: 250px; height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%);
          top: 40%; left: 50%;
          animation: float-slow 12s ease-in-out infinite reverse;
        }
        .feature-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .feature-card:hover {
          background: rgba(16,185,129,0.08);
          border-color: rgba(16,185,129,0.25);
          transform: translateX(4px);
        }
        .input-field {
          width: 100%;
          padding: 14px 18px;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: all 0.25s ease;
          background: #f8fafc;
          color: #1e293b;
          box-sizing: border-box;
        }
        .input-field:focus {
          border-color: #10b981;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.1);
        }
        .login-btn {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          color: white;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #059669 0%, #065f46 100%);
          background-size: 200% 200%;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(5,150,105,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(5,150,105,0.45);
          background: linear-gradient(135deg, #10b981 0%, #065f46 100%);
        }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .hex-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          color: #6ee7b7;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
        }
        .stat-pill strong { color: #e2e8f0; }
        
        .ring-pulse::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(16,185,129,0.5);
          animation: pulse-ring 2.5s ease-out infinite;
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] mesh-bg relative overflow-hidden flex-col">
        {/* Dot grid texture */}
        <div className="dot-grid" />

        {/* Ambient glow orbs */}
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />

        {/* Animated SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="#10b981" strokeWidth="0.5"
            strokeDasharray="8 12" style={{ animation: 'dash-move 6s linear infinite' }} />
          <line x1="0" y1="60%" x2="100%" y2="20%" stroke="#14b8a6" strokeWidth="0.5"
            strokeDasharray="6 16" style={{ animation: 'dash-move 9s linear infinite reverse' }} />
          <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#6ee7b7" strokeWidth="0.5"
            strokeDasharray="4 20" style={{ animation: 'dash-move 12s linear infinite' }} />
        </svg>

        {/* Central abstract visual */}
        <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Outer rotating ring */}
          <div style={{
            width: 280, height: 280,
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '50%',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Orbiting dot 1 */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 10, height: 10, marginTop: -5, marginLeft: -5,
              animation: 'orbit 8s linear infinite'
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
            </div>
            {/* Orbiting dot 2 */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 7, height: 7, marginTop: -3.5, marginLeft: -3.5,
              animation: 'orbit2 5s linear infinite'
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ee7b7', boxShadow: '0 0 8px #6ee7b7' }} />
            </div>

            {/* Inner ring */}
            <div style={{
              width: 160, height: 160,
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }} className="ring-pulse">
              {/* Center logo */}
              <div style={{
                width: 80, height: 80,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.3) 100%)',
                borderRadius: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(16,185,129,0.4)',
                backdropFilter: 'blur(10px)'
              }}>
                <img src="/assets/logo.png" alt="EMDECOB"
                  style={{ width: 48, height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Top brand */}
          <div className="anim-fade">
            <div className="flex items-center gap-3 mb-3">
              <img src="/assets/logo.png" alt="EMDECOB"
                style={{ width: 40, height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '0.12em' }}>EMDECOB</span>
            </div>
            <div className="hex-badge">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Plataforma de Gestión de Cobranza
            </div>
          </div>

          {/* Main heading */}
          <div className="my-auto" style={{ maxWidth: 440 }}>
            <p className="anim-slide-up" style={{ color: '#6ee7b7', fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
              Sistema integral de cobranza
            </p>
            <h1 className="anim-slide-up-d1" style={{
              color: '#fff', fontWeight: 900, fontSize: '3.2rem', lineHeight: 1.1,
              letterSpacing: '-0.02em', marginBottom: 24
            }}>
              Gestión<br />
              <span style={{
                background: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Inteligente</span><br />
              de Cartera
            </h1>
            <p className="anim-slide-up-d2" style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
              Automatiza la generación de cuentas de cobro, controla recaudos y gestiona múltiples portafolios desde un solo lugar.
            </p>

            {/* Feature list */}
            <div className="anim-slide-up-d3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map(({ icon: Icon, label, desc }) => (
                <div className="feature-card" key={label}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon style={{ width: 18, height: 18, color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, margin: 0 }}>{label}</p>
                    <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="anim-slide-up-d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="stat-pill">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span><strong>Multi-portafolio</strong> activo</span>
            </div>
            <div className="stat-pill">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
              <span><strong>Generación</strong> automatizada</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12"
        style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 50%, #f0f9ff 100%)', position: 'relative' }}>

        {/* Subtle background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center anim-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <img src="/assets/logo.png" alt="EMDECOB" style={{ width: 44, height: 44, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span style={{ fontWeight: 900, fontSize: 28, color: '#0f172a', letterSpacing: '0.1em' }}>EMDECOB</span>
          </div>
          <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Plataforma de Gestión de Cobranza
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Heading */}
          <div className="anim-slide-up" style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 16, marginBottom: 20,
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              border: '1px solid #a7f3d0'
            }}>
              <ShieldCheck style={{ width: 26, height: 26, color: '#059669' }} />
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Acceso Seguro
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, margin: 0, fontWeight: 400 }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form card */}
          <div className="anim-slide-up-d1" style={{
            background: '#fff',
            borderRadius: 24,
            padding: '32px 36px',
            marginBottom: 24,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 50px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
          }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Username */}
              <div>
                <label htmlFor="username" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8
                }}>
                  <User style={{ width: 15, height: 15, color: '#6b7280' }} />
                  Usuario
                </label>
                <input
                  id="username" name="username" type="text" required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Ingrese su usuario"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8
                }}>
                  <Lock style={{ width: 15, height: 15, color: '#6b7280' }} />
                  Contraseña
                </label>
                <input
                  id="password" name="password" type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Ingrese su contraseña"
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 12, padding: '12px 16px'
                }}>
                  <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, margin: 0, textAlign: 'center' }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="login-btn" style={{ marginTop: 4 }}>
                {isLoading ? (
                  <>
                    <svg style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
                      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight style={{ width: 17, height: 17 }} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="anim-slide-up-d2" style={{ textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
              Portal exclusivo para usuarios autorizados
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Sistema activo</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 11, marginTop: 16, fontWeight: 400 }}>
              © 2026 EMDECOB S.A.S. — Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
