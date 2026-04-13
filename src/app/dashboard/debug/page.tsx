import { getPrisma } from '@/lib/prisma';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function checkDatabase() {
  try {
    const prisma = getPrisma();
    const start = Date.now();
    const count = await prisma.invoice.count();
    return { success: true, time: Date.now() - start, count };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

export default async function DebugPage() {
  const dbStatus = await checkDatabase();
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? 'DEFINIDA (Presente)' : 'NO DEFINIDA (Falta)',
    NODE_ENV: process.env.NODE_ENV || 'Sin definir',
    NEXT_RUNTIME: (process as any).env?.NEXT_RUNTIME || 'Desconocido',
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="text-amber-500" />
        Panel de Diagnóstico de Producción
      </h1>

      <div className="grid gap-6">
        {/* Estado DB */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Estado de la Base de Datos</h2>
          {dbStatus.success ? (
            <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-lg">
              <CheckCircle2 />
              <div>
                <p className="font-bold">Conexión Exitosa</p>
                <p className="text-sm">Ping: {dbStatus.time}ms | Registros en BD: {dbStatus.count}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-lg">
              <AlertCircle />
              <div>
                <p className="font-bold">Fallo de Conexión</p>
                <p className="text-sm font-mono break-all">{dbStatus.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Variables de Entorno */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Variables de Entorno</h2>
          <div className="space-y-3">
            {Object.entries(envVars).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-mono text-sm text-slate-500">{key}</span>
                <span className={`font-bold text-sm ${val.includes('NO DEFINIDA') ? 'text-rose-500' : 'text-slate-800'}`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-slate-400 text-xs text-center italic">
          Este panel ayuda a identificar si el error "Server Components render" es un fallo de conectividad base o de empaquetado.
        </div>
      </div>
    </div>
  );
}
