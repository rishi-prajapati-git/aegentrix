"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  fetchMetrics,
  fetchAgents,
  fetchScenarios,
  fetchEvents,
  fetchIncidents,
  fetchPolicies,
  SystemMetrics,
  AgentModel,
  ScenarioInfo,
  AuditEvent,
  Incident,
  PolicyRule,
} from "../lib/api";
import { Navbar } from "../components/Navbar";
import { OverviewCards } from "../components/OverviewCards";
import { AuditTimeline } from "../components/AuditTimeline";
import { ScenarioRunner } from "../components/ScenarioRunner";
import { AgentRegistryView } from "../components/AgentRegistryView";
import { IncidentViewer } from "../components/IncidentViewer";
import { PolicyManager } from "../components/PolicyManager";
import { RefreshCw, Play, Cpu } from "lucide-react";

export default function SOCDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState("enforcing");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [m, a, sc, ev, inc, pol] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchAgents().catch(() => []),
        fetchScenarios().catch(() => []),
        fetchEvents(100).catch(() => []),
        fetchIncidents().catch(() => []),
        fetchPolicies().catch(() => []),
      ]);

      if (m) setMetrics(m);
      setAgents(a);
      setScenarios(sc);
      setEvents(ev);
      setIncidents(inc);
      setPolicies(pol);
      setSystemHealth("enforcing");
    } catch (err) {
      setSystemHealth("degraded");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-[#f1f2fa] text-[#383139] flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col space-y-4 sm:space-y-6 pb-12">
        {/* Streamlined Single-Line Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          systemHealth={systemHealth}
        />

        <main className="px-3 sm:px-6 space-y-5 sm:space-y-6">
          {/* Landing / Overview Page Only: Hero Masthead & Metrics */}
          {activeTab === "overview" && (
            <div className="space-y-5 sm:space-y-6 transition-all duration-300 ease-in-out">
              {/* Opening Large Pink Cushion with Headline, Actions & Static Clay Sculpture */}
              <section className="clay-cushion-pink p-6 sm:p-10 lg:p-12 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                  {/* Left Column: Opening Copy & Actions */}
                  <div className="max-w-2xl flex-1">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/70 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),0_2px_4px_rgba(56,49,57,0.08)] mb-4">
                      <span className="recessed-dot recessed-dot-green" aria-hidden="true"></span>
                      <span className="text-[12px] font-bold tracking-tight text-[#383139]">
                        AEGENTRIX GOVERNANCE ENGINE // MK-I
                      </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#383139] tracking-tighter leading-[1.05]">
                      Trust No Agent Blindly.
                    </h1>

                    <p className="mt-4 text-[#48404b] text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                      Continuous policy enforcement cushion gating every multi-agent data transfer, restricted ledger query, and tool execution with deterministic security.
                    </p>

                    {/* Pill Action Controls */}
                    <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                      <button
                        onClick={loadAllData}
                        disabled={isLoading}
                        className="clay-btn clay-btn-primary px-6 py-3 text-sm font-bold tracking-tight flex items-center space-x-2 shadow-md"
                        aria-label="Refresh live telemetry stream"
                      >
                        <RefreshCw className={`w-4 h-4 text-white ${isLoading ? "animate-spin" : ""}`} />
                        <span>{isLoading ? "Syncing Telemetry..." : "Cycle Live Sync"}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("scenarios")}
                        className="clay-btn clay-btn-cream px-6 py-3 text-sm font-bold tracking-tight flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4 text-[#383139]" />
                        <span>Launch Attack Tests</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("policies")}
                        className="clay-btn px-5 py-3 text-sm font-bold text-[#383139] hover:bg-white/40 transition-colors"
                      >
                        Policy Matrix →
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Molded Clay Objects Sculpture (Reserved Area) */}
                  <div className="w-full lg:w-[380px] h-[220px] sm:h-[260px] relative flex items-center justify-center pointer-events-none select-none">
                    <div className="relative w-full h-full max-w-[360px]">
                      {/* Lavender Clay Sphere */}
                      <div
                        className="absolute top-2 left-6 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#ded0f9] shadow-[0_16px_28px_-6px_rgba(125,107,163,0.35),inset_5px_5px_10px_rgba(255,255,255,0.9),inset_-5px_-5px_10px_rgba(125,107,163,0.3)] z-10"
                        aria-hidden="true"
                      ></div>

                      {/* Mint Clay Pill Capsule */}
                      <div
                        className="absolute top-10 right-4 w-36 h-20 sm:w-44 sm:h-24 rounded-[40px] bg-[#c0efdc] rotate-12 shadow-[0_18px_30px_-6px_rgba(88,158,131,0.35),inset_5px_5px_10px_rgba(255,255,255,0.95),inset_-5px_-5px_10px_rgba(88,158,131,0.25)] z-20"
                        aria-hidden="true"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/60 shadow-inner"></div>
                        </div>
                      </div>

                      {/* Warm Butter Yellow Clay Rounded Block */}
                      <div
                        className="absolute bottom-2 left-12 w-28 h-20 sm:w-36 sm:h-24 rounded-[30px] bg-[#f9e7a8] -rotate-6 shadow-[0_16px_28px_-6px_rgba(176,151,62,0.35),inset_4px_4px_8px_rgba(255,255,255,0.9),inset_-4px_-4px_8px_rgba(176,151,62,0.25)] z-30"
                        aria-hidden="true"
                      ></div>

                      {/* Pale Blue Clay Torus / Disc */}
                      <div
                        className="absolute bottom-4 right-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#c5e5fb] shadow-[0_16px_28px_-6px_rgba(89,140,175,0.35),inset_5px_5px_10px_rgba(255,255,255,0.9),inset_-5px_-5px_10px_rgba(89,140,175,0.3)] z-20 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f6a3ca] shadow-[inset_2px_2px_4px_rgba(182,86,131,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Supporting Telemetry Readouts in Pastel Cushions */}
              <OverviewCards metrics={metrics} onNavigateTab={setActiveTab} />
            </div>
          )}

          {/* Shared Content Reading Tray */}
          <section className="clay-tray p-4 sm:p-8 lg:p-10 transition-all duration-300">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Editorial Shelf with unequal feature arrangement */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Larger Item: Live Audit Stream */}
                  <div className="lg:col-span-2">
                    <AuditTimeline
                      events={events.slice(0, 10)}
                      onRefresh={loadAllData}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Smaller Explanations: Active Incidents */}
                  <div className="space-y-6">
                    <IncidentViewer
                      incidents={incidents.slice(0, 5)}
                      onRefresh={loadAllData}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <AuditTimeline events={events} onRefresh={loadAllData} isLoading={isLoading} />
            )}

            {activeTab === "scenarios" && (
              <ScenarioRunner scenarios={scenarios} onScenarioCompleted={loadAllData} />
            )}

            {activeTab === "incidents" && (
              <IncidentViewer incidents={incidents} onRefresh={loadAllData} />
            )}

            {activeTab === "agents" && (
              <AgentRegistryView agents={agents} onRefresh={loadAllData} />
            )}

            {activeTab === "policies" && (
              <PolicyManager policies={policies} onApprovalCreated={loadAllData} />
            )}
          </section>

          {/* Landing / Overview Page Closing Sections */}
          {activeTab === "overview" && (
            <div className="space-y-5 sm:space-y-6">
              {/* Lavender Decision Tray with Policy Disclosures & Architecture */}
              <section className="clay-cushion-lavender p-6 sm:p-8 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#48404b] uppercase tracking-wider">
                      Governance Architecture // Decision Layer
                    </span>
                    <h3 className="text-2xl font-bold text-[#383139] mt-0.5">
                      PEP Enforcement & Cryptographic Verification
                    </h3>
                    <p className="text-sm text-[#48404b] max-w-2xl mt-1">
                      Every cross-agent transaction evaluates source identity, destination, capability whitelist, and temporal HMAC tokens before payload dispatch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("policies")}
                      className="clay-btn clay-btn-cream px-5 py-2.5 text-xs font-bold text-[#383139]"
                    >
                      Manage Approvals
                    </button>
                    <button
                      onClick={() => setActiveTab("scenarios")}
                      className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold"
                    >
                      Test Intercepts
                    </button>
                  </div>
                </div>
              </section>

              {/* Return to Pink for Closing Cushion */}
              <section className="clay-cushion-pink p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center shadow-inner">
                    <Cpu className="w-6 h-6 text-[#383139]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#383139]">
                      AEGENTRIX MK-I • Zero Blind Trust
                    </h4>
                    <p className="text-xs sm:text-sm text-[#48404b]">
                      Deterministic multi-agent defense gating prompts, restricted files, and unauthorized lateral escalation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="clay-btn clay-btn-cream px-5 py-2.5 text-xs font-bold text-[#383139] whitespace-nowrap"
                >
                  Back to Top ↑
                </button>
              </section>
            </div>
          )}
        </main>

        {/* Clean Cream Tray for Footer */}
        <footer className="px-3 sm:px-6">
          <div className="clay-tray px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-[#48404b]">
            <div className="flex items-center space-x-2">
              <span className="recessed-dot recessed-dot-active" aria-hidden="true"></span>
              <span className="font-bold text-[#383139]">AEGENTRIX GOVERNANCE FRAMEWORK</span>
              <span>•</span>
              <span>STATUS NOMINAL</span>
            </div>

            <div className="text-center sm:text-right text-[11px] sm:text-[12px] text-[#48404b]">
              Continuous Policy Enforcement • Dual-Layer LLM Advisory Signal • Cryptographic Audit Chain
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
