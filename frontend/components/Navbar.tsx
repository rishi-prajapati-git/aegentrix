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
    { id: "overview", bay: "01", label: "OVERVIEW" },
    { id: "scenarios", bay: "02", label: "LAUNCHPAD" },
    { id: "timeline", bay: "03", label: "AUDIT STREAM" },
    { id: "incidents", bay: "04", label: "INCIDENT CHAIN" },
    { id: "agents", bay: "05", label: "AGENT MATRIX" },
    { id: "policies", bay: "06", label: "POLICY & VAULT" },
  ];

  return (
    <header className="relative border-b-2 border-[#b0b8bc] bg-[#cbd0d2] px-4 sm:px-6 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
      {/* Decorative Corner Hardware Screws */}
      <div className="absolute top-2.5 left-3">
        <span className="chassis-screw"></span>
      </div>
      <div className="absolute top-2.5 right-3">
        <span className="chassis-screw"></span>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Unit Plate & Identity */}
        <div className="flex items-center space-x-3.5 pl-2 sm:pl-4">
          <div className="w-10 h-10 rounded bg-[#e7eaeb] border border-[#ffffff] border-b-[#9da6ab] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#181e22]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-black tracking-tight text-xl text-[#181e22]">
                AEGENTRIX
              </span>
              <span className="engraved-label text-[10px] px-1.5 py-0.5 bg-[#b6bec2] rounded shadow-inner text-[#181e22] font-semibold">
                CHASSIS MK-I
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="vent-assembly">
                <span className="vent-slot"></span>
                <span className="vent-slot"></span>
                <span className="vent-slot"></span>
              </span>
              <span className="engraved-label text-[10px] text-[#414b52]">
                SECURE AGENTIC COORDINATION & GOVERNANCE
              </span>
            </div>
          </div>
        </div>

        {/* Bank of Raised Keys Navigation */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto p-1 bg-[#b6bec2] rounded-[6px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.22)] border border-[#a2abb0] border-b-[#ffffff]/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`chassis-key px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 ${
                  isActive ? "active" : ""
                }`}
              >
                <span
                  className={isActive ? "lamp-orange" : "lamp-off"}
                  aria-hidden="true"
                ></span>
                <span className="text-[10px] text-[#5e6b73] font-mono">[{tab.bay}]</span>
                <span className={isActive ? "text-[#181e22] font-bold" : "text-[#414b52]"}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* System Enforce / Online Lamp Module */}
        <div className="hidden lg:flex items-center space-x-3 pr-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#20272b] border border-[#141a1d] border-b-[#434d53] shadow-inner text-[#f2f4f4] text-xs font-mono">
            <span className="lamp-green"></span>
            <span className="text-[11px] font-semibold tracking-wider">
              {systemHealth === "enforcing" ? "ENFORCING // ARMED" : systemHealth.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
