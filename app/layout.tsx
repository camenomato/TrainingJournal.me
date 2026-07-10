import type { Metadata } from "next";
import { Bebas_Neue, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({ variable: "--font-disp", subsets: ["latin"], weight: "400" });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrainingJournal.me",
  description: "A training journal your AI actually reads — local-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
