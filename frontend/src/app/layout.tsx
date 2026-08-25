import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chakravyuh AI | World Model Cyber Defense Operations",
  description: "Predictive Attack Horizon & Targeted Host Micro-Isolation via ST-GNN and RSSM World Models (NTRO SIH26153)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-defense-bg text-slate-100 antialiased selection:bg-tactical-emerald/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
