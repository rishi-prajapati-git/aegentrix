"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent } from "../lib/api";
import { Search, Filter, FileText, FileDown, Plus, Minus, Radio } from "lucide-react";

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

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export PDF");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AEGENTRIX Audit Trail Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #181e22; background: #fff; }
            h1 { font-size: 22px; margin-bottom: 2px; color: #181e22; }
            .subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
            td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 9999px; font-weight: 700; font-size: 9px; }
            .badge-allow { background: #dcfce7; color: #166534; }
            .badge-deny { background: #fee2e2; color: #991b1b; }
            .badge-req { background: #fef3c7; color: #92400e; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; size: landscape; }
            }
          </style>
        </head>
        <body>
          <h1>AEGENTRIX // Cryptographic Audit Report</h1>
          <div class="subtitle">Generated on ${new Date().toLocaleString()} • Multi-Agent Governance Platform</div>
          <div class="meta-box">
            <strong>Total Filtered Events:</strong> ${filteredEvents.length} | 
            <strong>Policy Gating:</strong> Active Zero-Bypass PEP Engine
          </div>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event ID</th>
                <th>Source Agent</th>
                <th>Operation</th>
                <th>Target Resource</th>
                <th>Decision</th>
                <th>Reason Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(ev => `
                <tr>
                  <td>${new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td><code>${ev.event_id}</code></td>
                  <td>${ev.source_agent_id}</td>
                  <td><strong>${ev.operation}</strong></td>
                  <td>${ev.target_resource_or_recipient}</td>
                  <td>
                    <span class="badge ${ev.decision === "ALLOW" ? "badge-allow" : ev.decision === "DENY" ? "badge-deny" : "badge-req"}">
                      ${ev.decision}
                    </span>
                  </td>
                  <td>${ev.reason_description || ev.reason_code}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>AEGENTRIX Audit Trail</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333333; margin: 20px; }
            h1 { color: #181e22; font-size: 16pt; margin-bottom: 2pt; }
            p.meta { color: #666666; font-size: 9.5pt; margin-top: 0; margin-bottom: 14pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
            th { background-color: #f1f2fa; border: 1px solid #cbd5e1; padding: 6pt; text-align: left; font-size: 9.5pt; }
            td { border: 1px solid #e2e8f0; padding: 6pt; font-size: 9pt; vertical-align: top; }
          </style>
        </head>
        <body>
          <h1>AEGENTRIX Multi-Agent Security Audit Report</h1>
          <p class="meta">Export Timestamp: ${new Date().toISOString()} | Total Events: ${filteredEvents.length}</p>
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Source Agent</th>
                <th>Operation</th>
                <th>Target Resource</th>
                <th>Decision</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(ev => `
                <tr>
                  <td>${ev.event_id}</td>
                  <td>${new Date(ev.timestamp).toLocaleString()}</td>
                  <td>${ev.source_agent_id}</td>
                  <td>${ev.operation}</td>
                  <td>${ev.target_resource_or_recipient}</td>
                  <td><strong>${ev.decision}</strong></td>
                  <td>${ev.reason_description || ev.reason_code}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegentrix_audit_report_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 03 // Audit Stream
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ded0f9] text-[#383139]">
              LIVE
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Cryptographic Audit Timeline
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Cryptographically verified audit trail of all gated operations and advisory signals.
          </p>
        </div>

        {/* Action Controls with PDF & Word Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="clay-btn clay-btn-cream px-3 sm:px-3.5 py-1.5 text-xs font-bold text-[#383139] flex items-center space-x-1.5 shadow-sm"
            title="Export formatted PDF audit report"
          >
            <FileText className="w-3.5 h-3.5 text-[#f6a3ca]" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportWord}
            className="clay-btn clay-btn-cream px-3 sm:px-3.5 py-1.5 text-xs font-bold text-[#383139] flex items-center space-x-1.5 shadow-sm"
            title="Download Microsoft Word .doc report"
          >
            <FileDown className="w-3.5 h-3.5 text-[#383139]" />
            <span>Word</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="clay-btn clay-btn-lavender px-3.5 sm:px-4 py-1.5 text-xs font-bold text-[#383139] flex items-center space-x-1.5"
          >
            <span
              className={`recessed-dot w-2 h-2 ${isLoading ? "recessed-dot-orange animate-spin" : "recessed-dot-green"}`}
            ></span>
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Recessed Filter Sub-Bay */}
      <div className="clay-recessed p-2 rounded-[25px] flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#48404b]" />
          <input
            type="text"
            placeholder="Search telemetry by event ID, agent, resource URI, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 sm:py-2 bg-white/70 rounded-full text-xs sm:text-sm text-[#383139] placeholder-[#48404b]/60 shadow-[inset_1px_1px_2px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
          />
        </div>

        <div className="flex items-center space-x-2 px-1">
          <Filter className="w-4 h-4 text-[#48404b]" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-white/80 rounded-full px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#383139] shadow-[inset_1px_1px_2px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-extrabold text-[#383139] text-sm shrink-0">
                          {ev.operation}
                        </span>
                        <span className="text-[#48404b] font-medium shrink-0">→</span>
                        <span
                          className="text-[#48404b] font-bold text-xs bg-white/70 px-2 py-0.5 rounded-full shadow-sm max-w-[220px] sm:max-w-xs truncate inline-block align-middle"
                          title={ev.target_resource_or_recipient}
                        >
                          {ev.target_resource_or_recipient}
                        </span>

                        {ev.advisory_model_analysis && ev.advisory_model_analysis.flags.length > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#ded0f9] text-[#383139] text-[11px] font-bold shadow-sm max-w-full truncate">
                            <Radio className="w-3 h-3 text-[#383139] shrink-0" />
                            <span className="truncate">AI Signal: {ev.advisory_model_analysis.flags.join(", ")}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-[#48404b]">
                        <span className="font-semibold truncate max-w-[150px] inline-block" title={ev.source_agent_id}>
                          Src: {ev.source_agent_id}
                        </span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-[#48404b]/80 truncate max-w-[110px] inline-block" title={ev.event_id}>
                          {ev.event_id}
                        </span>
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
