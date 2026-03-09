import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin"] });
const jost = Jost({ 
  subsets: ["latin"], 
  variable: "--font-jost",
  weight: ['300', '400', '500', '600', '700', '800', '900'] 
});

export const metadata: Metadata = {
  title: "CobrosApp | Generador de Cuentas de Cobro",
  description: "Sistema premium de generación de cuentas de cobro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
