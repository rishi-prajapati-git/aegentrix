"use client";

import React from "react";
import { Cpu } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "scenarios", label: "Launch" },
    { id: "timeline", label: "Audit" },
    { id: "incidents", label: "Incidents" },
    { id: "agents", label: "Agents" },
    { id: "policies", label: "Policies" },
  ];

  return (
    <header className="w-full px-3 sm:px-6 pt-3 pb-1">
      <div className="clay-cushion-cream px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 overflow-hidden">
        {/* Brand Logo & Name in Compact Line */}
        <button
          onClick={() => setActiveTab("overview")}
          className="flex items-center space-x-2.5 flex-shrink-0 text-left focus:outline-none"
          title="Return to Overview"
        >
          <div className="w-9 h-9 rounded-full bg-[#ded0f9] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(125,107,163,0.25),0_4px_8px_-2px_rgba(56,49,57,0.1)] flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4 h-4 text-[#383139]" />
          </div>
          <span className="font-extrabold tracking-tight text-lg text-[#383139] select-none">
            AEGENTRIX
          </span>
        </button>

        {/* Single-Line Uniform Navigation Pills */}
        <nav
          aria-label="Dashboard sections"
          className="flex items-center space-x-1 sm:space-x-1.5 p-1 bg-[#f1f2fa] rounded-full shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.9)] overflow-x-auto no-scrollbar flex-nowrap"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`clay-btn px-3 sm:px-4 py-1.5 text-xs font-bold whitespace-nowrap rounded-full transition-all duration-interaction flex items-center justify-center space-x-1.5 flex-shrink-0 ${
                  isActive
                    ? "clay-btn-lavender shadow-[0_4px_10px_-2px_rgba(222,208,249,0.8),inset_2px_2px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_3px_rgba(125,107,163,0.3)] text-[#383139]"
                    : "text-[#48404b] hover:text-[#383139] hover:bg-white/60 bg-transparent shadow-none"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`recessed-dot w-2 h-2 ${
                    isActive ? "recessed-dot-active" : "recessed-dot-inactive"
                  }`}
                  aria-hidden="true"
                ></span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Compact System Health Pill */}
        <div className="flex-shrink-0 hidden md:flex items-center">
          <div className="clay-cushion-mint px-3 py-1 rounded-full flex items-center space-x-1.5 text-[11px] font-bold text-[#383139]">
            <span className="recessed-dot recessed-dot-green w-2 h-2 animate-pulse" aria-hidden="true"></span>
            <span>{systemHealth === "enforcing" ? "ARMED" : systemHealth.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
