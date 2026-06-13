"use client"

import type { Lead } from "@/lib/types"
import StatusBadge from "./StatusBadge"

function formatDate(date?: string | null) {
    if (!date) return ""
    const d = new Date(date)
    const now = new Date()
    const diffHrs = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))

    if (diffHrs < 1) return "Just now"
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffHrs < 48) return "Yesterday"
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const STATUS_COLORS: Record<string, string> = {
    new: "#068DD4",
    contacted: "#7C3AED",
    follow_up: "#D97706",
    qualified: "#059669",
    scheduled: "#2563EB",
    won: "#16A34A",
    lost: "#6B7280",
}

interface LeadCardProps {
    lead: Lead
    onClick: () => void
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
    return (
        <div
            className="lead-card"
            onClick={onClick}
            style={{ borderLeftColor: STATUS_COLORS[lead.status] || "#068DD4" }}
        >
            <div className="lead-card-header">
                <div>
                    <div className="lead-card-name">{lead.fullname}</div>
                    <div className="lead-card-meta">
                        <span>{lead.city || "—"}</span>
                        <span>·</span>
                        <span>{lead.numberofpanels} panels</span>
                        <span>·</span>
                        <span>{formatDate(lead.createdAt)}</span>
                    </div>
                </div>
                <div className="lead-card-price">${lead.price}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <StatusBadge status={lead.status} />
                {lead.source && <span className="source-tag">{lead.source}</span>}
            </div>
        </div>
    )
}
