-- Eliminar duplicados: mantener solo el registro más reciente de cada consecutivo
DELETE FROM "Invoice"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY consecutivo ORDER BY "createdAt" DESC) as rn
    FROM "Invoice"
  ) sub
  WHERE sub.rn > 1
);
