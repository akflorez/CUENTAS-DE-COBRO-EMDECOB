"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, FileUp, Eye, ChevronRight, ChevronLeft, Send, ListChecks } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/upload", label: "Cargar Datos", icon: FileUp },
    { href: "/dashboard/validate", label: "Validación", icon: Eye },
    { href: "/dashboard/preview", label: "Vista Previa", icon: FileText },
    { href: "/dashboard/emailing", label: "Enviar por Correo", icon: Send },
    { href: "/dashboard/gestion", label: "Gestión Recaudos", icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 hidden md:flex flex-col shrink-0 relative overflow-visible z-20`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-24 z-30 flex items-center justify-center w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md text-slate-500 hover:text-emerald-500 hover:border-emerald-200 transition-colors focus:outline-none"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Background image + gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/assets/sidebar_bg.png" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/95 via-emerald-950/90 to-slate-950/95" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className={`h-20 flex items-center border-b border-white/10 transition-all ${isSidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
            <div className={`w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center backdrop-blur-sm shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`}>
              <img src="/assets/logo.png" alt="EMDECOB" className="w-6 h-6 object-contain" onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }} />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="text-white font-bold text-lg tracking-tight block leading-tight">EMDECOB<span className="text-emerald-400">.</span></span>
                <span className="text-emerald-500/60 text-[10px] font-medium uppercase tracking-widest">Propiedad Horizontal</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className={`flex-1 py-6 space-y-2 ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
            {isSidebarOpen && <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest px-3 mb-3">Navegación</p>}
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`flex items-center py-3 text-sm font-medium rounded-xl transition-all group overflow-hidden ${isSidebarOpen ? 'px-4' : 'justify-center'} ${
                    isActive 
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 shadow-lg shadow-emerald-900/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'} transition-colors`} />
                  {isSidebarOpen && (
                    <>
                      <span className="whitespace-nowrap">{item.label}</span>
                      {isActive && <ChevronRight className="ml-auto w-4 h-4 text-emerald-500/50" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom */}
          <div className={`p-4 border-t border-white/10 flex ${!isSidebarOpen ? 'justify-center' : ''}`}>
            <Link 
              href="/login" 
              title={!isSidebarOpen ? "Cerrar Sesión" : undefined}
              className={`flex items-center py-3 text-sm font-medium rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20 overflow-hidden ${isSidebarOpen ? 'px-4 w-full' : 'justify-center w-12 h-12'}`}
            >
              <LogOut className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} />
              {isSidebarOpen && <span className="whitespace-nowrap">Cerrar Sesión</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="sm:hidden flex items-center">
            <span className="text-emerald-700 font-bold text-lg">EMDECOB<span className="text-emerald-400">.</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-slate-700 font-medium text-sm">Panel de Generación de Cuentas de Cobro Propiedad Horizontal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                PH
              </div>
              <span className="text-xs font-semibold text-emerald-800 hidden sm:block">Propiedad Horizontal</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
