import fs from 'fs';
import path from 'path';

// Las imagenes base64 están muy grandes para pasarlas por script, así que las extraeremos copiando los archivos originales 
// de la carpeta temporal a los assets publicos de Next.js
export default function noop() {}
