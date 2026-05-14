SELECT "conjuntoNombre", COUNT(*) as cantidad, 
       STRING_AGG(consecutivo, ', ' ORDER BY consecutivo) as consecutivos
FROM "Invoice" 
GROUP BY "conjuntoNombre"
HAVING COUNT(*) > 1
ORDER BY "conjuntoNombre";
