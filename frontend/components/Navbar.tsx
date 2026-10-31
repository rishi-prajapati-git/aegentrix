"use client";

import React from "react";
import { ShieldCheck, Activity, Terminal, Lock } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  const tabs = [
    { id: "overview", label: "SOC Overview" },
    { id: "scenarios", label: "Scenario Runner" },
    { id: "timeline", label: "Audit Timeline" },
    { id: "incidents", label: "Incident Chains" },
    { id: "agents", label: "Agent Registry" },
    { id: "policies", label: "Policy & Approvals" },
  ];

  return (
    <header className="border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-wider text-slate-100">AEGENTRIX</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Secure Multi-Agent Governance</p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono">{systemHealth.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
