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
      {/* Raised Hardware Deck Housing the Test Matrix */}
      <div className="bg-[#cbd0d2] border-2 border-[#b0b8bc] rounded-xl p-5 shadow-chassis relative">
        <span className="chassis-screw absolute top-3 left-3"></span>
        <span className="chassis-screw absolute top-3 right-3"></span>

        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#a4adb2] px-2 gap-3">
          <div className="flex items-center space-x-3">
            <div className="vent-assembly">
              <span className="vent-slot"></span>
              <span className="vent-slot"></span>
              <span className="vent-slot"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="engraved-label text-xs font-bold text-[#181e22]">BAY 02 // TEST LAUNCHPAD</span>
                <span className="text-[10px] font-mono text-[#58656d]">7 CALIBRATED ATTACK SCENARIOS</span>
              </div>
              <p className="text-xs text-[#414b52] mt-0.5 font-sans">
                Trigger real adversarial vector injections and legitimate multi-agent operations against the PEP engine.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-center">
            <span className="lamp-green"></span>
            <span className="engraved-label text-[10px]">PEP HARDWARE GATING: ARMED</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded bg-[#351a1e] border border-[#f87171]/40 text-[#fca5a5] text-xs font-mono">
            [ERROR // EXECUTION INTERRUPTED]: {errorMsg}
          </div>
        )}

        {/* Inset Matrix within Raised Deck */}
        <div className="bg-[#b6bec2] p-3 rounded-lg shadow-well border border-[#a2abb0] border-b-white mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.map((sc) => {
            const isRunning = runningId === sc.scenario_id;
            const isAdversarial = sc.category === "ADVERSARIAL";
            return (
              <div
                key={sc.scenario_id}
                className="bg-[#e7eaeb] border border-[#ffffff] border-b-[#9ca5aa] rounded p-4 flex flex-col justify-between shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#cbd0d2] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={isAdversarial ? "lamp-orange" : "lamp-green"}></span>
                      <span className="text-[10px] font-mono font-bold text-[#181e22] tracking-wider uppercase">
                        {sc.category} VECTOR
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#616f77] font-semibold">{sc.scenario_id}</span>
                  </div>

                  <h3 className="text-sm font-bold text-[#181e22] mt-2 tracking-tight">{sc.title}</h3>
                  <p className="text-xs text-[#414b52] mt-1 leading-relaxed">{sc.description}</p>

                  <div className="mt-3 p-2.5 rounded recessed-screen text-[11px] font-mono">
                    <span className="text-[#84949e] font-semibold block text-[10px] uppercase">Expected Intercept:</span>
                    <span className="text-[#d8dee1]">{sc.expected_outcome}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#cbd0d2]">
                  <button
                    onClick={() => handleRun(sc.scenario_id)}
                    disabled={isRunning || runningId !== null}
                    className="chassis-key w-full py-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 text-[#181e22] disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-[#f15b22]" />
                    <span>{isRunning ? "EXECUTION IN PROGRESS..." : "ENGAGE SCENARIO TEST"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recessed Execution Results Output Screen */}
      {lastResult && (
        <div className="recessed-screen p-5 shadow-screen border-2 border-[#121619] border-b-[#3e484e] rounded-xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-[#293339]">
            <div className="flex items-center space-x-2">
              <span className="lamp-green"></span>
              <span className="font-mono text-xs font-bold tracking-wider text-[#f2f4f4]">
                EXECUTION OUTPUT // {lastResult.scenario_id.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#8c9ca6]">
              <Clock className="w-3.5 h-3.5" />
              <span>{lastResult.execution_time_ms} ms</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#171c1f] rounded border border-[#273035]">
              <span className="text-[#81919b] text-[10px] font-mono block uppercase">Authoritative Decision:</span>
              <span
                className={`text-sm font-bold font-mono mt-1 block ${
                  lastResult.overall_decision.includes("ALLOW")
                    ? "text-[#4ade80]"
                    : lastResult.overall_decision.includes("INCIDENT")
                    ? "text-[#f15b22]"
                    : "text-[#f87171]"
                }`}
              >
                {lastResult.overall_decision}
              </span>
            </div>
            <div className="p-3 bg-[#171c1f] rounded border border-[#273035]">
              <span className="text-[#81919b] text-[10px] font-mono block uppercase">Audit Events Emitted:</span>
              <span className="text-sm font-bold font-mono text-[#f2f4f4] mt-1 block">
                {lastResult.events_generated?.length || 0} Gated Records
              </span>
            </div>
            <div className="p-3 bg-[#171c1f] rounded border border-[#273035]">
              <span className="text-[#81919b] text-[10px] font-mono block uppercase">Correlated Incidents:</span>
              <span className="text-sm font-bold font-mono text-[#f15b22] mt-1 block">
                {lastResult.incidents_triggered?.length || 0} Incident Chains
              </span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-[#14181a] rounded border border-[#232b2f] text-xs font-mono text-[#d8dee1] leading-relaxed">
            <span className="text-[#72838d] block text-[10px] font-bold uppercase mb-1">Telemetry Summary:</span>
            {lastResult.summary}
          </div>
        </div>
      )}
    </div>
  );
};
