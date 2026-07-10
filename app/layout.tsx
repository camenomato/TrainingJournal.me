import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrainingJournal.me",
  description: "A training journal your AI actually reads — local-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
