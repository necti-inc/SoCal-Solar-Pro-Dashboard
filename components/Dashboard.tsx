"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchLeads, fetchStats, isAuthenticated, logout } from "@/lib/api"
import { config } from "@/lib/config"
import type { Lead, LeadStats } from "@/lib/types"
import { PIPELINE_STATUSES, STATUS_CONFIG } from "@/lib/types"
import Login from "./Login"
import LeadCard from "./LeadCard"
import LeadDetail from "./LeadDetail"

type View = "leads" | "pipeline" | "stats"

export default function Dashboard() {
    const [authed, setAuthed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [view, setView] = useState<View>("leads")
    const [leads, setLeads] = useState<Lead[]>([])
    const [stats, setStats] = useState<LeadStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [toast, setToast] = useState("")

    useEffect(() => {
        setMounted(true)
        setAuthed(isAuthenticated())
    }, [])

    const showToast = useCallback((msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(""), 2500)
    }, [])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [leadsData, statsData] = await Promise.all([
                fetchLeads({
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    search: search || undefined,
                }),
                fetchStats(),
            ])
            setLeads(leadsData)
            setStats(statsData)
        } catch (err) {
            if (err instanceof Error && err.message === "UNAUTHORIZED") {
                setAuthed(false)
            }
        } finally {
            setLoading(false)
        }
    }, [statusFilter, search])

    useEffect(() => {
        if (authed) loadData()
    }, [authed, loadData])

    useEffect(() => {
        if (!authed) return
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [authed, loadData])

    const handleLeadUpdate = (updated: Lead) => {
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
        setSelectedLead(updated)
        fetchStats().then(setStats).catch(() => {})
    }

    if (!mounted) return null

    if (!authed) {
        return <Login onLogin={() => setAuthed(true)} />
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <h1>{config.appName}</h1>
                    <div className="subtitle">{config.appSubtitle}</div>
                </div>
                <nav className="desktop-nav">
                    {(["leads", "pipeline", "stats"] as View[]).map((v) => (
                        <button
                            key={v}
                            className={`nav-tab ${view === v ? "active" : ""}`}
                            onClick={() => setView(v)}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </nav>
                <button
                    className="btn btn-secondary"
                    style={{ padding: "8px 14px", minHeight: "auto", fontSize: 13 }}
                    onClick={() => {
                        logout()
                        setAuthed(false)
                    }}
                >
                    Sign Out
                </button>
            </header>

            <main className="app-main">
                {stats && (
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="value">{stats.byStatus.new || 0}</div>
                            <div className="label">New</div>
                        </div>
                        <div className="stat-card">
                            <div className="value">{stats.today}</div>
                            <div className="label">Today</div>
                        </div>
                        <div className="stat-card">
                            <div className="value">{stats.total}</div>
                            <div className="label">Total</div>
                        </div>
                        <div className="stat-card">
                            <div className="value">{stats.thisWeek}</div>
                            <div className="label">This Week</div>
                        </div>
                        <div className="stat-card">
                            <div className="value">{stats.byStatus.won || 0}</div>
                            <div className="label">Won</div>
                        </div>
                    </div>
                )}

                {view === "pipeline" ? (
                    <div>
                        {PIPELINE_STATUSES.map((status) => {
                            const statusLeads = leads.filter((l) => l.status === status)
                            if (statusLeads.length === 0) return null
                            const cfg = STATUS_CONFIG[status]
                            return (
                                <div key={status} style={{ marginBottom: 20 }}>
                                    <h3
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: cfg.color,
                                            marginBottom: 8,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {cfg.label} ({statusLeads.length})
                                    </h3>
                                    <div className="lead-list">
                                        {statusLeads.map((lead) => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onClick={() => setSelectedLead(lead)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : view === "stats" ? (
                    <div>
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                marginBottom: 16,
                                color: "var(--text-secondary)",
                            }}
                        >
                            BY STATUS
                        </h3>
                        {stats &&
                            PIPELINE_STATUSES.map((s) => (
                                <div
                                    key={s}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "12px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>
                                        {STATUS_CONFIG[s].label}
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: STATUS_CONFIG[s].color,
                                        }}
                                    >
                                        {stats.byStatus[s] || 0}
                                    </span>
                                </div>
                            ))}

                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                margin: "24px 0 16px",
                                color: "var(--text-secondary)",
                            }}
                        >
                            BY SOURCE
                        </h3>
                        {stats &&
                            Object.entries(stats.bySource).map(([source, count]) => (
                                <div
                                    key={source}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "12px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {source}
                                    </span>
                                    <span style={{ fontWeight: 700 }}>{count}</span>
                                </div>
                            ))}
                    </div>
                ) : (
                    <>
                        <div className="search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="search"
                                placeholder="Search name, phone, email, city..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="filter-bar">
                            <button
                                className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
                                onClick={() => setStatusFilter("all")}
                            >
                                All
                            </button>
                            {PIPELINE_STATUSES.map((s) => (
                                <button
                                    key={s}
                                    className={`filter-chip ${statusFilter === s ? "active" : ""}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {STATUS_CONFIG[s].label}
                                    {stats ? ` (${stats.byStatus[s] || 0})` : ""}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="loading">
                                <div className="spinner" />
                                <p style={{ marginTop: 12 }}>Loading leads...</p>
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">📋</div>
                                <p>No leads found</p>
                            </div>
                        ) : (
                            <div className="lead-list">
                                {leads.map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onClick={() => setSelectedLead(lead)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <nav className="bottom-nav">
                <button
                    className={`nav-item ${view === "leads" ? "active" : ""}`}
                    onClick={() => setView("leads")}
                >
                    <span className="nav-icon">📋</span>
                    Leads
                </button>
                <button
                    className={`nav-item ${view === "pipeline" ? "active" : ""}`}
                    onClick={() => setView("pipeline")}
                >
                    <span className="nav-icon">📊</span>
                    Pipeline
                </button>
                <button
                    className={`nav-item ${view === "stats" ? "active" : ""}`}
                    onClick={() => setView("stats")}
                >
                    <span className="nav-icon">📈</span>
                    Stats
                </button>
            </nav>

            {selectedLead && (
                <LeadDetail
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleLeadUpdate}
                    showToast={showToast}
                />
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    )
}
