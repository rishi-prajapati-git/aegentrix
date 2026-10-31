"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent } from "../lib/api";
import { Search, Filter, Download, Plus, Minus, Shield, Check, Clock, Radio } from "lucide-react";

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
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#c0efdc] text-[#245842] text-xs font-bold shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(88,158,131,0.25)]">
            <span className="recessed-dot recessed-dot-green"></span>
            <span>ALLOW</span>
          </span>
        );
      case "DENY":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f6a3ca] text-[#78234e] text-xs font-bold shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(182,86,131,0.25)]">
            <span className="recessed-dot recessed-dot-orange"></span>
            <span>DENY</span>
          </span>
        );
      case "REQUIRE_APPROVAL":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f9e7a8] text-[#6b5816] text-xs font-bold shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(176,151,62,0.25)]">
            <span className="recessed-dot recessed-dot-orange"></span>
            <span>APPROVAL REQ</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-[#f1f2fa] text-[#48404b] text-xs font-bold">
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
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 03 // Audit Stream
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ded0f9] text-[#383139]">
              LIVE RECORD
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Cryptographic Audit Timeline
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Cryptographically verified audit trail of all gated operations and advisory signals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport("json")}
            className="clay-btn clay-btn-cream px-3.5 py-2 text-xs font-bold text-[#383139] flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#383139]" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="clay-btn clay-btn-cream px-3.5 py-2 text-xs font-bold text-[#383139] flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#383139]" />
            <span>CSV</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="clay-btn clay-btn-lavender px-4 py-2 text-xs font-bold text-[#383139] flex items-center space-x-1.5"
          >
            <span
              className={`recessed-dot ${isLoading ? "recessed-dot-orange" : "recessed-dot-green"}`}
            ></span>
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Recessed Filter Sub-Bay */}
      <div className="clay-recessed p-2 rounded-[25px] flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#48404b]" />
          <input
            type="text"
            placeholder="Search telemetry by event ID, agent, resource URI, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 rounded-full text-xs sm:text-sm text-[#383139] placeholder-[#48404b]/60 shadow-[inset_1px_1px_2px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
          />
        </div>

        <div className="flex items-center space-x-2 px-1">
          <Filter className="w-4 h-4 text-[#48404b]" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-white/80 rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-[#383139] shadow-[inset_1px_1px_2px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
          >
            <option value="ALL">All Events ({events.length})</option>
            <option value="ALLOW">Allow Only</option>
            <option value="DENY">Deny Only</option>
            <option value="REQUIRE_APPROVAL">Approval Required</option>
          </select>
        </div>
      </div>

      {/* Events Stream Shelves */}
      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="clay-cushion-cream p-8 text-center text-[#48404b] text-sm">
            No audit events found matching the specified criteria.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedEventId === ev.event_id;
            return (
              <div
                key={ev.event_id}
                className="clay-shelf p-4 transition-all"
              >
                <div
                  onClick={() => toggleExpand(ev.event_id)}
                  className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleExpand(ev.event_id);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center space-x-3">
                    {/* Recessed circular plus/minus disclosure */}
                    <div className="w-7 h-7 rounded-full bg-[#f1f2fa] flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(56,49,57,0.2),0_1px_0_rgba(255,255,255,0.9)] text-[#383139] flex-shrink-0">
                      {isExpanded ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-extrabold text-[#383139] text-sm">
                          {ev.operation}
                        </span>
                        <span className="text-[#48404b] font-medium">→</span>
                        <span className="text-[#48404b] font-bold text-xs bg-white/70 px-2 py-0.5 rounded-full shadow-sm">
                          {ev.target_resource_or_recipient}
                        </span>

                        {ev.advisory_model_analysis && ev.advisory_model_analysis.flags.length > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#ded0f9] text-[#383139] text-[11px] font-bold shadow-sm">
                            <Radio className="w-3 h-3 text-[#383139]" />
                            <span>AI Signal: {ev.advisory_model_analysis.flags.join(", ")}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1.5 text-xs text-[#48404b]">
                        <span className="font-semibold">Src: {ev.source_agent_id}</span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-[#48404b]/80">{ev.event_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-xs text-[#48404b] font-mono hidden md:inline">
                      {ev.reason_code}
                    </span>
                    {getDecisionPill(ev.decision)}
                  </div>
                </div>

                {/* Disclosure Expanded Well */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#383139]/10 space-y-3 text-xs text-[#383139]">
                    <div className="clay-recessed p-3 rounded-[20px]">
                      <span className="text-[#48404b] font-bold uppercase text-[11px] block">
                        Reason Description:
                      </span>
                      <p className="mt-1 text-sm font-medium text-[#383139]">
                        {ev.reason_description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white/60 rounded-[20px] shadow-sm space-y-1">
                        <span className="text-[#48404b] font-bold uppercase text-[11px] block">
                          Workflow & Provenance:
                        </span>
                        <div>Workflow ID: <span className="font-mono font-bold">{ev.workflow_id}</span></div>
                        <div>Correlation ID: <span className="font-mono font-bold">{ev.correlation_id}</span></div>
                        <div>Matched Policy: <span className="font-mono font-bold">{ev.matched_policy_id || "POL-DEFAULT"}</span></div>
                        <div>Payload Scope: <span className="font-mono font-bold">{ev.payload_size_bytes} Bytes</span></div>
                      </div>

                      {ev.advisory_model_analysis && (
                        <div className="p-3 bg-white/60 rounded-[20px] shadow-sm space-y-1">
                          <span className="text-[#48404b] font-bold uppercase text-[11px] block">
                            Advisory AI Signal Details:
                          </span>
                          <div>Provider: <span className="font-semibold">{ev.advisory_model_analysis.provider}</span></div>
                          <div>Risk Score: <span className="font-bold text-[#78234e]">{ev.advisory_model_analysis.risk_score}</span></div>
                          <div>Latency: <span className="font-mono">{ev.advisory_model_analysis.latency_ms} ms</span></div>
                          <div>Diagnostic: <span className="font-medium">{ev.advisory_model_analysis.summary}</span></div>
                        </div>
                      )}
                    </div>

                    {ev.sanitized_metadata && Object.keys(ev.sanitized_metadata).length > 0 && (
                      <div className="pt-1">
                        <span className="text-[#48404b] font-bold uppercase text-[11px] block mb-1">
                          Sanitized Payload Metadata [Secrets Redacted]:
                        </span>
                        <pre className="p-3 rounded-[20px] bg-[#f1f2fa] text-xs font-mono text-[#383139] overflow-x-auto shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)]">
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
