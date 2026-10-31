import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AEGENTRIX — Multi-Agent Governance & Security Platform",
  description: "Deterministic policy enforcement layer for secure multi-agent AI collaboration.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="bg-[#f1f2fa] text-[#383139] min-h-screen antialiased selection:bg-[#f6a3ca] selection:text-[#383139]">
        {children}
      </body>
    </html>
  );
}
