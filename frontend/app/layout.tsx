import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AEGENTRIX — Multi-Agent Governance & Security Platform",
  description: "Deterministic policy enforcement layer for secure multi-agent AI collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-dark text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
