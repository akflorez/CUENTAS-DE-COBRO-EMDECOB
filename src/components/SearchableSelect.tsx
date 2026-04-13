"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Buscar...", label }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm min-w-[200px]"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <div className="flex-grow">
          {label && <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none mb-0.5">{label}</span>}
          <span className="text-xs font-bold text-slate-700 truncate block">
            {value === "Todos" ? "Todos los Conjuntos" : value}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <input 
              autoFocus
              type="text"
              className="w-full bg-transparent border-none outline-none text-xs font-medium py-1 placeholder:text-slate-300"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="p-1 hover:bg-slate-200 rounded-full">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          <div className="max-h-[250px] overflow-y-auto py-1">
            <div 
              onClick={() => { onChange("Todos"); setIsOpen(false); setSearchTerm(""); }}
              className={`px-4 py-2 text-xs font-bold cursor-pointer hover:bg-emerald-50 transition-colors ${value === "Todos" ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}
            >
              Todos los Conjuntos
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(""); }}
                  className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-emerald-50 transition-colors ${value === opt ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-xs text-slate-400 text-center italic">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
