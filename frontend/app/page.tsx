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
import { RefreshCw, Shield, Terminal } from "lucide-react";

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
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-4 md:px-8 flex justify-center">
      {/* Main Continuous Instrument Chassis */}
      <div className="w-full max-w-7xl bg-[#cbd0d2] border-4 border-[#b4bcc0] rounded-2xl sm:rounded-3xl shadow-chassis overflow-hidden flex flex-col relative">
        {/* Navigation Deck */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          systemHealth={systemHealth}
        />

        {/* Chassis Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Opening Instrument Masthead with Control Assembly */}
          <section className="bg-[#e7eaeb] border border-white border-b-[#9ca5aa] rounded-xl p-5 sm:p-7 shadow-[0_2px_4px_rgba(0,0,0,0.12)] relative">
            <span className="chassis-screw absolute top-3 left-3"></span>
            <span className="chassis-screw absolute top-3 right-3"></span>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
              {/* Heading */}
              <div className="max-w-3xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="lamp-green"></span>
                  <span className="engraved-label text-[10px]">
                    AEGENTRIX GOVERNANCE ENGINE // MK-I SPECIFICATION
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#181e22] tracking-tighter leading-none">
                  Trust No Agent Blindly.
                </h1>
                <p className="mt-3 text-[#414b52] text-sm sm:text-base leading-relaxed max-w-2xl font-sans font-medium">
                  Continuous instrument chassis gating every multi-agent data transfer, restricted ledger query, and tool execution with deterministic policy enforcement.
                </p>
              </div>

              {/* Compact Hardware Control Assembly */}
              <div className="flex items-center space-x-4 bg-[#b6bec2] p-3 rounded-xl shadow-well border border-[#a2abb0] border-b-white self-start lg:self-center">
                {/* Vent Slots */}
                <div className="vent-assembly px-1">
                  <span className="vent-slot"></span>
                  <span className="vent-slot"></span>
                  <span className="vent-slot"></span>
                  <span className="vent-slot"></span>
                </div>

                {/* Circular Dial Action Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={loadAllData}
                    disabled={isLoading}
                    title="Engage live telemetry refresh"
                    className="chassis-dial group"
                    aria-label="Engage live telemetry refresh dial"
                  >
                    <span className="chassis-dial-indicator"></span>
                    <RefreshCw className={`w-5 h-5 text-[#2a343b] group-hover:text-[#181e22] transition ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                  <span className="engraved-label text-[9px] mt-1 text-[#2c373d]">CYCLE SYNC</span>
                </div>

                {/* Secondary Key Action */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveTab("scenarios")}
                    className="chassis-key px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#181e22]"
                  >
                    RUN TESTS
                  </button>
                  <span className="engraved-label text-[9px] mt-1 text-[#2c373d]">ENGAGE PEP</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recessed Facts Display Deck (Overview KPI Readouts) */}
          <OverviewCards metrics={metrics} onNavigateTab={setActiveTab} />

          {/* Bay Panels */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AuditTimeline
                  events={events.slice(0, 10)}
                  onRefresh={loadAllData}
                  isLoading={isLoading}
                />
              </div>
              <div className="space-y-6">
                <IncidentViewer incidents={incidents.slice(0, 5)} onRefresh={loadAllData} />
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
        </div>

        {/* Pale Closing Bay & Industrial Hardware Footer */}
        <footer className="bg-[#b6bec2] border-t-2 border-[#a4adb2] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#414b52] gap-2">
          <div className="flex items-center space-x-2">
            <span className="chassis-screw"></span>
            <span className="engraved-label text-[10px]">CHASSIS BAY 00 // STATUS NOMINAL</span>
          </div>
          <div className="text-center sm:text-right text-[11px] font-semibold text-[#2b353b]">
            AEGENTRIX MK-I • DETERMINISTIC MULTI-AGENT GOVERNANCE LAYER • ZERO BLIND TRUST
          </div>
        </footer>
      </div>
    </div>
  );
}
