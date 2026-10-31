"use client";

import React, { useState } from "react";
import { ScenarioInfo, runScenario } from "../lib/api";
import { Play, ShieldCheck, Clock, AlertTriangle, Radio, CheckCircle2, Ban, ShieldAlert, ArrowRight, Check } from "lucide-react";

interface ScenarioRunnerProps {
  scenarios: ScenarioInfo[];
  onScenarioCompleted: () => void;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({ scenarios, onScenarioCompleted }) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [scenarioResults, setScenarioResults] = useState<Record<string, any>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRun = async (scenarioId: string) => {
    // Run ONLY this scenario without dimming or disabling any other scenario cards
    setRunningId(scenarioId);
    setErrorMsg(null);

    try {
      // Deliberate brief animation so user sees the evaluating state
      await new Promise((r) => setTimeout(r, 350));
      const result = await runScenario(scenarioId);

      // Store the result specifically for this scenario ID
      setScenarioResults((prev) => ({
        ...prev,
        [scenarioId]: result,
      }));

      onScenarioCompleted();
    } catch (err: any) {
      setErrorMsg(`Scenario ${scenarioId} failed: ${err.message || "Network / Backend connection error"}`);
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
            Click &apos;Engage Test&apos; on any vector. The Policy Enforcement Point (PEP) will evaluate and display the authoritative result directly beneath that scenario.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#c0efdc] text-[#245842] text-xs font-bold shadow-sm self-start sm:self-center">
          <span className="recessed-dot recessed-dot-green animate-pulse"></span>
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
          const isThisCardRunning = runningId === sc.scenario_id;
          const isAdversarial = sc.category === "ADVERSARIAL";
          const cardResult = scenarioResults[sc.scenario_id];

          return (
            <div
              key={sc.scenario_id}
              className={`p-5 sm:p-6 rounded-[32px] transition-all flex flex-col justify-between ${
                cardResult
                  ? "bg-[#fffdf7] ring-2 ring-[#c0efdc] shadow-md"
                  : "bg-[#fffdf7] shadow-[0_12px_24px_-6px_rgba(56,49,57,0.08),inset_3px_3px_6px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(56,49,57,0.07)]"
              }`}
            >
              <div>
                {/* Header Tag & ID */}
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

                {/* Expected Intercept Box */}
                <div className="mt-4 p-3 rounded-[20px] clay-recessed text-xs">
                  <span className="text-[#48404b] font-bold block text-[11px] uppercase mb-0.5">
                    Expected Intercept:
                  </span>
                  <span className="text-[#383139] font-medium font-mono text-[11.5px]">
                    {sc.expected_outcome}
                  </span>
                </div>
              </div>

              {/* Action Button & In-Card Direct Result */}
              <div className="mt-5 pt-3 border-t border-[#383139]/10 space-y-3">
                <button
                  onClick={() => handleRun(sc.scenario_id)}
                  disabled={isThisCardRunning}
                  className={`clay-btn w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                    isThisCardRunning
                      ? "clay-btn-lavender text-[#383139]"
                      : "clay-btn-primary text-white"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isThisCardRunning ? "animate-spin text-[#383139]" : "text-[#f6a3ca]"}`} />
                  <span>
                    {isThisCardRunning ? "Evaluating Invariants..." : "Engage Scenario Test"}
                  </span>
                </button>

                {/* Live In-Card Evaluating Progress (Appears right under button) */}
                {isThisCardRunning && (
                  <div className="p-3.5 rounded-[22px] bg-[#ded0f9]/40 border border-[#ded0f9] text-xs font-bold text-[#383139] flex items-center space-x-2 animate-pulse">
                    <Radio className="w-4 h-4 text-[#78234e] animate-spin" />
                    <span>Evaluating Gateway PEP & Policy Invariants...</span>
                  </div>
                )}

                {/* DIRECT IN-CARD EXECUTION RESULT (Right below this scenario!) */}
                {cardResult && !isThisCardRunning && (
                  <div className="p-4 rounded-[22px] bg-[#f1f2fa] border border-[#ded0f9] space-y-2 shadow-inner transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#245842]" />
                        <span className="font-extrabold text-[#383139] text-xs uppercase">
                          Execution Successful
                        </span>
                      </div>
                      <span
                        className={`font-extrabold px-3 py-0.5 rounded-full text-xs shadow-sm ${
                          cardResult.overall_decision?.includes("ALLOW")
                            ? "bg-[#c0efdc] text-[#245842]"
                            : cardResult.overall_decision?.includes("INCIDENT")
                            ? "bg-[#ded0f9] text-[#78234e]"
                            : "bg-[#f6a3ca] text-[#78234e]"
                        }`}
                      >
                        {cardResult.overall_decision}
                      </span>
                    </div>

                    <div className="text-xs text-[#383139] font-medium leading-relaxed bg-white/80 p-2.5 rounded-[16px] shadow-sm">
                      {cardResult.summary || "Deterministic policy evaluation completed."}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#48404b] pt-1 border-t border-[#383139]/10">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#383139]" />
                        <span>Latency: {cardResult.execution_time_ms} ms</span>
                      </span>
                      <span>
                        Events Logged: <strong>{cardResult.events_generated?.length || 0}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
