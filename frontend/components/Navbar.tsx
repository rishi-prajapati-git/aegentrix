"use client";

import React from "react";
import { ShieldCheck, Cpu } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  const tabs = [
    { id: "overview", num: "01", label: "Overview" },
    { id: "scenarios", num: "02", label: "Launchpad" },
    { id: "timeline", num: "03", label: "Audit Stream" },
    { id: "incidents", num: "04", label: "Incident Chain" },
    { id: "agents", num: "05", label: "Agent Matrix" },
    { id: "policies", num: "06", label: "Policy Vault" },
  ];

  return (
    <header className="w-full px-4 sm:px-6 py-4">
      <div className="clay-cushion-cream px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-[22px] bg-[#ded0f9] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(125,107,163,0.25),0_6px_12px_-2px_rgba(56,49,57,0.12)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#383139]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-xl text-[#383139]">
                AEGENTRIX
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f6a3ca] text-[#383139] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(182,86,131,0.25)]">
                PEP ENGINE
              </span>
            </div>
            <div className="text-[12px] text-[#48404b] font-medium">
              Deterministic Multi-Agent Governance & Policy Enforcement
            </div>
          </div>
        </div>

        {/* Thick Pill Navigation Bar */}
        <nav
          aria-label="Dashboard sections"
          className="flex items-center flex-wrap gap-2 p-1.5 bg-[#f1f2fa] rounded-full shadow-[inset_2px_2px_4px_rgba(56,49,57,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`clay-btn px-4 py-2 text-[13px] font-bold tracking-tight flex items-center space-x-2 ${
                  isActive
                    ? "clay-btn-lavender shadow-[0_8px_16px_-2px_rgba(222,208,249,0.8),inset_2px_2px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_3px_rgba(125,107,163,0.3)] text-[#383139]"
                    : "text-[#48404b] hover:text-[#383139] hover:bg-white/60"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`recessed-dot ${
                    isActive ? "recessed-dot-active" : "recessed-dot-inactive"
                  }`}
                  aria-hidden="true"
                ></span>
                <span className="text-[11px] text-[#48404b]/70 font-mono">[{tab.num}]</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Health / Enforcing Badge */}
        <div className="hidden lg:flex items-center">
          <div className="clay-cushion-mint px-4 py-2 rounded-full flex items-center space-x-2 text-xs font-bold text-[#383139]">
            <span className="recessed-dot recessed-dot-green animate-pulse" aria-hidden="true"></span>
            <span className="tracking-wide">
              {systemHealth === "enforcing" ? "ENFORCING // ARMED" : systemHealth.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
