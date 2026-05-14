-- PASO 1: VER LOS DUPLICADOS (mismo nombre + mismo monto + mismo mes generación)
-- Ejecutar esto primero para VERIFICAR antes de borrar

SELECT 
  "conjuntoNombre",
  ROUND("honorariosTotal"::numeric) as honorarios,
  COALESCE("generacionMes", EXTRACT(MONTH FROM "createdAt")::int) as mes_gen,
  COALESCE("generacionAnio", EXTRACT(YEAR FROM "createdAt")::int) as anio_gen,
  COUNT(*) as cantidad,
  STRING_AGG(consecutivo, ', ' ORDER BY "createdAt" DESC) as consecutivos
FROM "Invoice"
GROUP BY 
  TRIM(UPPER("conjuntoNombre")), 
  "conjuntoNombre",
  ROUND("honorariosTotal"::numeric),
  COALESCE("generacionMes", EXTRACT(MONTH FROM "createdAt")::int),
  COALESCE("generacionAnio", EXTRACT(YEAR FROM "createdAt")::int)
HAVING COUNT(*) > 1
ORDER BY "conjuntoNombre";
