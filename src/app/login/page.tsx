"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Shield, BarChart3, Scale, Headphones } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (username.trim() === 'PROPIEDAD HORIZONTAL' && password === '292509') {
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Hero with tech background */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden group">
        {/* Background image with slow pan/zoom animation */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[20s] ease-out scale-100 group-hover:scale-110"
          style={{ backgroundImage: `url('/assets/modern_property_bg.png')`, animation: 'slow-pan 30s ease-in-out infinite alternate' }}
        />
        {/* Gradient overlay - adjusted for a cleaner green/white premium look */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-emerald-800/90 to-teal-900/80 backdrop-blur-[2px]" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-left font-sans">
            {/* Logo and Brand Name */}
            <div className="flex flex-col items-start gap-1 mb-4" style={{ animation: 'fade-in 1.2s ease-out forwards' }}>
              <div className="flex flex-row items-center gap-4">
                <img src="/assets/logo.png" alt="EMDECOB" className="w-16 h-16 object-contain z-10 filter drop-shadow-xl" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
                <span className="text-white font-black text-5xl tracking-widest drop-shadow-md">EMDECOB</span>
              </div>
              <span className="text-emerald-100/90 text-[13px] font-medium tracking-[0.2em] mt-3 drop-shadow-sm uppercase" style={{ fontFamily: 'var(--font-jost)' }}>
                &quot;Servicios estratégicos para empresas de hoy&quot;
              </span>
            </div>
          
          
          <div className="space-y-8 my-auto max-w-2xl" style={{ animation: 'fade-in-up 1.5s ease-out forwards 0.3s', opacity: 0, fontFamily: 'var(--font-jost)' }}>
            <style jsx>{`
              @keyframes fade-in-up {
                0% { opacity: 0; transform: translateY(40px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              @keyframes fade-in {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes slow-pan {
                0% { transform: scale(1.0) translate(0, 0); }
                50% { transform: scale(1.05) translate(-1%, -1%); }
                100% { transform: scale(1.1) translate(1%, 1%); }
              }
            `}</style>
            <div>
              <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-8 tracking-tight drop-shadow-lg">
                Generación de<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-white">Cuentas de Cobro</span>
              </h1>
              <p className="text-emerald-50 text-2xl max-w-lg leading-relaxed font-light mt-4 drop-shadow-md">
                Plataforma tecnológica para la generación automatizada de cuentas de cobro de propiedad horizontal.
              </p>
            </div>
          </div>

          <p className="text-white text-sm mt-auto drop-shadow-sm font-medium">
            &copy; 2026 EMDECOB S.A.S. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-[#f8f9fa] relative" style={{ fontFamily: 'var(--font-jost)' }}>
        {/* Mobile logo inline */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
          <div className="flex flex-row items-center gap-3 mb-3">
            <img src="/assets/logo.png" alt="EMDECOB" className="w-12 h-12 object-contain drop-shadow-sm" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
            <h2 className="text-4xl font-black text-slate-800 tracking-widest">EMDECOB</h2>
          </div>
          <span className="text-emerald-700/80 text-[10px] font-bold tracking-[0.2em] uppercase text-center">
            &quot;Servicios estratégicos para empresas de hoy&quot;
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Main Titles Above Card */}
          <div className="mb-8 text-center" style={{ animation: 'fade-in-up 0.8s ease-out forwards' }}>
            <h2 className="text-4xl font-extrabold text-[#111827] tracking-tight mb-2">
              Bienvenido
            </h2>
            <p className="text-base text-slate-500 font-medium">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* White Card Container */}
          <div 
            className="bg-white rounded-[2rem] p-8 sm:p-10 w-full mb-8 relative"
            style={{ boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.08), 0 0 10px rgba(0,0,0,0.01)', animation: 'fade-in-up 1s ease-out forwards 0.1s', opacity: 0 }}
          >
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="flex items-center text-sm font-semibold text-slate-700 mb-2.5">
                  <User className="h-4 w-4 mr-2.5 text-slate-500" strokeWidth={2.5} />
                  Usuario
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full px-5 py-4 text-[15px] font-medium border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 border outline-none transition-all bg-white text-slate-800 placeholder-slate-400"
                    placeholder="Ingrese su usuario"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="flex items-center text-sm font-semibold text-slate-700 mb-2.5">
                  <Lock className="h-4 w-4 mr-2.5 text-slate-500" strokeWidth={2.5} />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-5 py-4 text-[15px] font-medium border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 border outline-none transition-all bg-white text-slate-800 placeholder-slate-400"
                    placeholder="Ingrese su contraseña"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 p-4 border border-red-100">
                  <p className="text-sm font-semibold text-red-700 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex justify-center py-4 px-4 rounded-2xl text-[15px] font-bold text-white bg-[#105E3E] hover:bg-[#0c4a31] focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20 group"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Iniciar sesión
                    <ArrowRight className="ml-2.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center gap-2" style={{ animation: 'fade-in 1s ease-out forwards 0.4s', opacity: 0 }}>
            <p className="text-[14px] text-slate-500 font-medium">
              Portal exclusivo para usuarios autorizados
            </p>
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-[12px] font-medium text-slate-400">Sistema activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
