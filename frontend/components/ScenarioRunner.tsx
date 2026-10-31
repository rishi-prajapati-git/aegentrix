"use client";

import React, { useState } from "react";
import { ScenarioInfo, runScenario } from "../lib/api";
import { Play, ShieldCheck, Clock, AlertTriangle, Radio } from "lucide-react";

interface ScenarioRunnerProps {
  scenarios: ScenarioInfo[];
  onScenarioCompleted: () => void;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({ scenarios, onScenarioCompleted }) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRun = async (scenarioId: string) => {
    setRunningId(scenarioId);
    setErrorMsg(null);
    try {
      const result = await runScenario(scenarioId);
      setLastResult(result);
      onScenarioCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute scenario");
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 02 // Test Launchpad
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f9e7a8] text-[#6b5816]">
              {scenarios.length} SCENARIOS
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Adversarial Test Matrix
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Trigger real adversarial vector injections and legitimate multi-agent operations against the PEP engine.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#c0efdc] text-[#245842] text-xs font-bold shadow-sm">
          <span className="recessed-dot recessed-dot-green"></span>
          <span>PEP Hardware Gating: Armed</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[25px] bg-[#f6a3ca]/30 border border-[#f6a3ca] text-[#78234e] text-xs sm:text-sm font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>[Execution Interrupted]: {errorMsg}</span>
        </div>
      )}

      {/* Grid of Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.scenario_id;
          const isAdversarial = sc.category === "ADVERSARIAL";
          return (
            <div
              key={sc.scenario_id}
              className="p-6 rounded-[32px] bg-[#fffdf7] shadow-[0_12px_24px_-6px_rgba(56,49,57,0.08),inset_3px_3px_6px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(56,49,57,0.07)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#383139]/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`recessed-dot ${
                        isAdversarial ? "recessed-dot-orange" : "recessed-dot-green"
                      }`}
                    ></span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isAdversarial
                          ? "bg-[#f6a3ca] text-[#78234e]"
                          : "bg-[#c0efdc] text-[#245842]"
                      }`}
                    >
                      {sc.category} VECTOR
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#48404b]">
                    {sc.scenario_id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#383139] mt-3 tracking-tight">
                  {sc.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#48404b] mt-1 leading-relaxed">
                  {sc.description}
                </p>

                <div className="mt-4 p-3 rounded-[20px] clay-recessed text-xs">
                  <span className="text-[#48404b] font-bold block text-[11px] uppercase mb-0.5">
                    Expected Intercept:
                  </span>
                  <span className="text-[#383139] font-medium font-mono">
                    {sc.expected_outcome}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#383139]/10">
                <button
                  onClick={() => handleRun(sc.scenario_id)}
                  disabled={isRunning || runningId !== null}
                  className="clay-btn clay-btn-primary w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 text-[#f6a3ca] ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Engaging Test..." : "Engage Scenario Test"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Results Output Screen in Soft Lavender Cushion */}
      {lastResult && (
        <div className="clay-cushion-lavender p-6 sm:p-8 rounded-[38px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#383139]/10">
            <div className="flex items-center space-x-2">
              <span className="recessed-dot recessed-dot-green"></span>
              <span className="text-sm font-bold tracking-tight text-[#383139]">
                Execution Output // {lastResult.scenario_id.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#48404b]">
              <Clock className="w-3.5 h-3.5" />
              <span>{lastResult.execution_time_ms} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-white/80 rounded-[24px] shadow-sm">
              <span className="text-[#48404b] text-[11px] font-bold block uppercase">
                Authoritative Decision:
              </span>
              <span
                className={`text-base font-extrabold mt-1 block ${
                  lastResult.overall_decision.includes("ALLOW")
                    ? "text-[#245842]"
                    : "text-[#78234e]"
                }`}
              >
                {lastResult.overall_decision}
              </span>
            </div>

            <div className="p-4 bg-white/80 rounded-[24px] shadow-sm">
              <span className="text-[#48404b] text-[11px] font-bold block uppercase">
                Audit Events Emitted:
              </span>
              <span className="text-base font-extrabold font-mono text-[#383139] mt-1 block">
                {lastResult.events_generated?.length || 0} Gated Records
              </span>
            </div>

            <div className="p-4 bg-white/80 rounded-[24px] shadow-sm">
              <span className="text-[#48404b] text-[11px] font-bold block uppercase">
                Incidents Logged:
              </span>
              <span className="text-base font-extrabold font-mono text-[#383139] mt-1 block">
                {lastResult.incidents_generated?.length || 0} Incident Chains
              </span>
            </div>
          </div>

          {lastResult.scenario_description && (
            <div className="p-4 bg-white/70 rounded-[24px] shadow-sm text-xs text-[#383139]">
              <span className="font-bold block uppercase text-[11px] text-[#48404b] mb-1">
                Diagnostic Trace:
              </span>
              <p className="font-medium">{lastResult.scenario_description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
