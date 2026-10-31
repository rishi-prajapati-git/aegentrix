"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent } from "../lib/api";
import { Search, Filter, Download, ChevronDown, ChevronRight, Shield, AlertTriangle, Check, X, Clock } from "lucide-react";

interface AuditTimelineProps {
  events: AuditEvent[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events, onRefresh, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<string>("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesDecision = decisionFilter === "ALL" || ev.decision === decisionFilter;
      const matchesSearch =
        searchTerm === "" ||
        ev.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.source_agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.target_resource_or_recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.reason_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.reason_description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDecision && matchesSearch;
    });
  }, [events, decisionFilter, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "ALLOW":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            <span>ALLOW</span>
          </span>
        );
      case "DENY":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <X className="w-3 h-3" />
            <span>DENY</span>
          </span>
        );
      case "REQUIRE_APPROVAL":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>APPROVAL REQ</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {decision}
          </span>
        );
    }
  };

  const handleExport = (format: "csv" | "json") => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/events/export?format=${format}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Audit Timeline (Security Event Stream)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time, cryptographically verified record of every protected read, transfer, and tool invocation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport("json")}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Live Refresh"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 my-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event ID, agent, resource, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Decisions ({events.length})</option>
            <option value="ALLOW">Allowed Only</option>
            <option value="DENY">Denied Only</option>
            <option value="REQUIRE_APPROVAL">Approval Required</option>
          </select>
        </div>
      </div>

      {/* Events Stream */}
      <div className="space-y-3 mt-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No events matching your search or filter criteria.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedEventId === ev.event_id;
            return (
              <div
                key={ev.event_id}
                className={`border rounded-lg transition-all ${
                  ev.decision === "DENY"
                    ? "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40"
                    : ev.decision === "REQUIRE_APPROVAL"
                    ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div
                  onClick={() => toggleExpand(ev.event_id)}
                  className="p-4 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-cyan-400">
                          {ev.operation}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="font-mono text-xs text-slate-200">
                          {ev.target_resource_or_recipient}
                        </span>
                        {ev.advisory_model_analysis && ev.advisory_model_analysis.flags.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                            AI FLAGGED: {ev.advisory_model_analysis.flags.join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>Agent: {ev.source_agent_id}</span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="text-slate-500">{ev.event_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      {ev.reason_code}
                    </span>
                    {getDecisionBadge(ev.decision)}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-950/40 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Reason Description:</span>
                      <p className="mt-1 text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
                        {ev.reason_description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 font-semibold">Workflow & Correlation:</span>
                        <div className="mt-1 font-mono text-[11px] text-slate-300 space-y-1">
                          <div>Workflow ID: {ev.workflow_id}</div>
                          <div>Correlation ID: {ev.correlation_id}</div>
                          <div>Matched Policy: {ev.matched_policy_id || "POL-DEFAULT"}</div>
                          <div>Payload Size: {ev.payload_size_bytes} bytes</div>
                        </div>
                      </div>

                      {ev.advisory_model_analysis && (
                        <div>
                          <span className="text-slate-400 font-semibold">Advisory AI Analysis:</span>
                          <div className="mt-1 font-mono text-[11px] text-slate-300 space-y-1">
                            <div>Provider: {ev.advisory_model_analysis.provider}</div>
                            <div>Risk Score: {ev.advisory_model_analysis.risk_score}</div>
                            <div>Latency: {ev.advisory_model_analysis.latency_ms} ms</div>
                            <div>Summary: {ev.advisory_model_analysis.summary}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {ev.sanitized_metadata && Object.keys(ev.sanitized_metadata).length > 0 && (
                      <div>
                        <span className="text-slate-400 font-semibold">Sanitized Metadata (Secrets Redacted):</span>
                        <pre className="mt-1 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                          {JSON.stringify(ev.sanitized_metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
