"use client"

import type { LeadStatus } from "@/lib/types"
import { STATUS_CONFIG } from "@/lib/types"

interface StatusBadgeProps {
    status: LeadStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new

    return (
        <span
            className="status-badge"
            style={{ color: cfg.color, background: cfg.bg }}
        >
            {cfg.label}
        </span>
    )
}
