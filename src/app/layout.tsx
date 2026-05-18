import type { Metadata } from "next";
import { Inter } from "next/font/google";
import TopMenu from "./TopMenu";
import packageJson from "../../package.json";
import "./globals.css";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });
const appVersion = packageJson.version;

export const metadata: Metadata = {
  title: "Football Team Manager",
  description: "Gestione della squadra di calcio, rosa, tornei ed eventi in partita",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={inter.className}>
      <body>
        <div className="app-container">
          <TopMenu />
          {children}
          <footer className="app-footer">Versione {appVersion}</footer>
        </div>
      </body>
    </html>
  );
}
