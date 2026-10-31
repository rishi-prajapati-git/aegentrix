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

export default function SOCDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState("healthy");
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
    // Periodic refresh every 10 seconds
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-cyber-dark text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top KPI Metric Cards (Visible on all tabs) */}
        <OverviewCards metrics={metrics} onNavigateTab={setActiveTab} />

        {/* Tab Views */}
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
      </main>

      <footer className="border-t border-cyber-border py-4 text-center text-xs text-slate-500 font-mono">
        AEGENTRIX — Secure Multi-Agent AI Coordination & Governance • Trust no agent blindly. Govern every action.
      </footer>
    </div>
  );
}
