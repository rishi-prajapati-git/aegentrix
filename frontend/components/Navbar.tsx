"use client";

import React from "react";
import Image from "next/image";

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
          className="flex items-center space-x-2.5 flex-shrink-0 text-left focus:outline-none group"
          title="Return to Overview"
        >
          <div className="w-10 h-10 rounded-full bg-[#111827] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.4),0_4px_10px_-2px_rgba(0,0,0,0.3)] flex items-center justify-center flex-shrink-0 overflow-hidden border border-cyan-400/40 p-0.5 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="AEGENTRIX Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tight text-lg text-[#383139] select-none leading-tight">
              AEGENTRIX
            </span>
            <span className="text-[10px] font-semibold text-cyan-700 tracking-wider font-mono">
              ZERO-TRUST PEP
            </span>
          </div>
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
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Compact Status Pill */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="clay-status-mint px-2.5 sm:px-3 py-1 flex items-center space-x-1.5 rounded-full text-xs font-bold shadow-[0_3px_8px_-2px_rgba(197,249,219,0.9),inset_1px_1px_2px_rgba(255,255,255,0.9)]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="hidden sm:inline tracking-wider font-mono text-[11px] uppercase">
              {systemHealth}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
