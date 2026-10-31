"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent } from "../lib/api";
import { Search, Filter, Download, ChevronDown, ChevronRight, Shield, Check, X, Clock, Terminal } from "lucide-react";

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

  const getDecisionPill = (decision: string) => {
    switch (decision) {
      case "ALLOW":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#132d20] border border-[#22c55e]/40 text-[#4ade80] text-[10px] font-mono font-bold tracking-wider">
            <span className="lamp-green"></span>
            <span>ALLOW</span>
          </span>
        );
      case "DENY":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#37191d] border border-[#f87171]/40 text-[#f87171] text-[10px] font-mono font-bold tracking-wider">
            <span className="lamp-orange"></span>
            <span>DENY</span>
          </span>
        );
      case "REQUIRE_APPROVAL":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#332213] border border-[#f59e0b]/40 text-[#fbbf24] text-[10px] font-mono font-bold tracking-wider">
            <span className="lamp-orange"></span>
            <span>APPROVAL_REQ</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-[#2a343b] text-[#d8dee1] text-[10px] font-mono">
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
    <div className="bg-[#cbd0d2] border-2 border-[#b0b8bc] rounded-xl p-5 shadow-chassis relative">
      {/* Decorative Screws */}
      <span className="chassis-screw absolute top-3 left-3"></span>
      <span className="chassis-screw absolute top-3 right-3"></span>

      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#a4adb2] px-2">
        <div className="flex items-center space-x-3">
          <div className="vent-assembly">
            <span className="vent-slot"></span>
            <span className="vent-slot"></span>
            <span className="vent-slot"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="engraved-label text-xs font-bold text-[#181e22]">BAY 03 // AUDIT TIMELINE</span>
              <span className="text-[10px] font-mono text-[#58656d]">RECORDING STREAM</span>
            </div>
            <p className="text-xs text-[#414b52] mt-0.5 font-sans">
              Cryptographically verified audit trail of all gated operations and advisory signals.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport("json")}
            className="chassis-key px-3 py-1.5 text-[11px] font-mono font-semibold text-[#181e22] flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-[#526068]" />
            <span>EXPORT JSON</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="chassis-key px-3 py-1.5 text-[11px] font-mono font-semibold text-[#181e22] flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-[#526068]" />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="chassis-key px-3 py-1.5 text-[11px] font-mono font-semibold text-[#181e22] flex items-center space-x-1.5"
          >
            <span className={isLoading ? "lamp-orange" : "lamp-green"}></span>
            <span>{isLoading ? "POLLING..." : "REFRESH"}</span>
          </button>
        </div>
      </div>

      {/* Recessed Control Sub-Bay: Search and Filter */}
      <div className="bg-[#b6bec2] p-2.5 rounded-lg shadow-well border border-[#a2abb0] border-b-white my-3 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#525f67]" />
          <input
            type="text"
            placeholder="Search telemetry by event ID, agent, resource URI, reason code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#20272b] border border-[#141a1d] border-b-[#434d53] rounded text-xs font-mono text-[#f2f4f4] placeholder-[#76858e] shadow-inner focus:outline-none focus:ring-1 focus:ring-[#f15b22]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#414b52]" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-[#20272b] border border-[#141a1d] border-b-[#434d53] rounded px-3 py-1.5 text-xs font-mono text-[#f2f4f4] shadow-inner focus:outline-none focus:ring-1 focus:ring-[#f15b22]"
          >
            <option value="ALL">ALL FILTER ({events.length})</option>
            <option value="ALLOW">ALLOW ONLY</option>
            <option value="DENY">DENY ONLY</option>
            <option value="REQUIRE_APPROVAL">APPROVAL REQUIRED</option>
          </select>
        </div>
      </div>

      {/* Recessed Dark Telemetry Output Deck */}
      <div className="recessed-screen p-3 space-y-2 mt-3 max-h-[620px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#7f8e97] text-xs font-mono">
            {"// NO AUDIT EVENTS MATCHING FILTER CRITERIA //"}
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedEventId === ev.event_id;
            return (
              <div
                key={ev.event_id}
                className={`border rounded transition-all text-xs font-mono ${
                  ev.decision === "DENY"
                    ? "border-[#f87171]/30 bg-[#251e21]"
                    : ev.decision === "REQUIRE_APPROVAL"
                    ? "border-[#f59e0b]/30 bg-[#28231a]"
                    : "border-[#2f3940] bg-[#1a2024] hover:border-[#414f57]"
                }`}
              >
                <div
                  onClick={() => toggleExpand(ev.event_id)}
                  className="p-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center space-x-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#7d8c95]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#7d8c95]" />
                    )}
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-[#f2f4f4]">{ev.operation}</span>
                        <span className="text-[#6c7b84]">→</span>
                        <span className="text-[#a4b5bf]">{ev.target_resource_or_recipient}</span>
                        {ev.advisory_model_analysis && ev.advisory_model_analysis.flags.length > 0 && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#f15b22]/20 border border-[#f15b22]/40 text-[#f15b22] text-[9px] font-bold">
                            <span className="lamp-orange"></span>
                            <span>AI FLAG: {ev.advisory_model_analysis.flags.join(", ")}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-[#788892]">
                        <span>SRC: {ev.source_agent_id}</span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="text-[#59666f]">{ev.event_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-[11px] text-[#8e9fa9] hidden md:inline">
                      {ev.reason_code}
                    </span>
                    {getDecisionPill(ev.decision)}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#263137] bg-[#121619] space-y-3 text-[11px] text-[#d8dee1]">
                    <div>
                      <span className="text-[#768691] font-semibold uppercase text-[10px] block">
                        Reason Description:
                      </span>
                      <p className="mt-1 p-2 rounded bg-[#1c2327] border border-[#2b353b] text-[#f2f4f4]">
                        {ev.reason_description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <span className="text-[#768691] font-semibold uppercase text-[10px] block">
                          Workflow & Provenance:
                        </span>
                        <div>Workflow ID: <span className="text-[#f2f4f4]">{ev.workflow_id}</span></div>
                        <div>Correlation ID: <span className="text-[#f2f4f4]">{ev.correlation_id}</span></div>
                        <div>Matched Policy: <span className="text-[#f2f4f4]">{ev.matched_policy_id || "POL-DEFAULT"}</span></div>
                        <div>Payload Scope: <span className="text-[#f2f4f4]">{ev.payload_size_bytes} Bytes</span></div>
                      </div>

                      {ev.advisory_model_analysis && (
                        <div className="space-y-1">
                          <span className="text-[#768691] font-semibold uppercase text-[10px] block">
                            Advisory AI Signal Details:
                          </span>
                          <div>Provider: <span className="text-[#f2f4f4]">{ev.advisory_model_analysis.provider}</span></div>
                          <div>Risk Score: <span className="text-[#f15b22] font-bold">{ev.advisory_model_analysis.risk_score}</span></div>
                          <div>Latency: <span className="text-[#f2f4f4]">{ev.advisory_model_analysis.latency_ms} ms</span></div>
                          <div>Diagnostic: <span className="text-[#d8dee1]">{ev.advisory_model_analysis.summary}</span></div>
                        </div>
                      )}
                    </div>

                    {ev.sanitized_metadata && Object.keys(ev.sanitized_metadata).length > 0 && (
                      <div className="pt-1">
                        <span className="text-[#768691] font-semibold uppercase text-[10px] block">
                          Sanitized Payload Metadata [Secrets Redacted]:
                        </span>
                        <pre className="mt-1 p-2 rounded bg-[#181e22] border border-[#293237] text-[10px] text-[#93a6b2] overflow-x-auto">
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
