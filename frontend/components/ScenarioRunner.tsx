"use client";

import React, { useState } from "react";
import { ScenarioInfo, runScenario } from "../lib/api";
import { Play, CheckCircle2, AlertOctagon, Info, Clock, ShieldCheck, ChevronRight } from "lucide-react";

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
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-cyber-border">
          <Play className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">Interactive Attack & Scenario Launchpad</h2>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Execute real benign workflows and adversarial attack cases against the backend policy enforcement engine.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {scenarios.map((sc) => {
            const isRunning = runningId === sc.scenario_id;
            const isAdversarial = sc.category === "ADVERSARIAL";
            return (
              <div
                key={sc.scenario_id}
                className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isAdversarial
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : sc.category === "SYSTEM"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {sc.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{sc.scenario_id}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mt-2">{sc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.description}</p>

                  <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]">
                    <span className="text-slate-400 font-semibold">Expected: </span>
                    <span className="text-slate-300 font-mono">{sc.expected_outcome}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRun(sc.scenario_id)}
                  disabled={isRunning || runningId !== null}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                    isAdversarial
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                  } disabled:opacity-50`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isRunning ? "Running Scenario..." : "Run Scenario"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Results Inspector */}
      {lastResult && (
        <div className="bg-cyber-card border border-cyan-500/30 rounded-xl p-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Execution Result: {lastResult.scenario_id}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{lastResult.execution_time_ms} ms</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs">Overall Outcome</span>
              <p
                className={`text-sm font-bold font-mono mt-1 ${
                  lastResult.overall_decision.includes("ALLOW")
                    ? "text-emerald-400"
                    : lastResult.overall_decision.includes("INCIDENT")
                    ? "text-purple-400"
                    : "text-rose-400"
                }`}
              >
                {lastResult.overall_decision}
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs">Events Produced</span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1">
                {lastResult.events_generated?.length || 0} Events
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs">Incidents Raised</span>
              <p className="text-sm font-bold font-mono text-amber-400 mt-1">
                {lastResult.incidents_triggered?.length || 0} Correlated
              </p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
            {lastResult.summary}
          </div>
        </div>
      )}
    </div>
  );
};
