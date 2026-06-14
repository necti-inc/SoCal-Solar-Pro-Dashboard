"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchLeads, fetchStats, deleteLead, isAuthenticated, logout } from "@/lib/api"
import { config } from "@/lib/config"
import { getFollowUpAlerts } from "@/lib/followups"
import type { Lead, LeadStats } from "@/lib/types"
import { PIPELINE_STATUSES, STATUS_CONFIG } from "@/lib/types"
import ActionAlerts from "./ActionAlerts"
import Login from "./Login"
import LeadCard from "./LeadCard"
import LeadDetail from "./LeadDetail"
import PipelineBoard from "./PipelineBoard"
import StatsOverview, { StatsView } from "./StatsOverview"
import {
    IconLeads,
    IconList,
    IconLogout,
    IconPipeline,
    IconSearch,
    IconStats,
    IconSun,
} from "./icons"

type View = "leads" | "stats"
type LeadsLayout = "pipeline" | "list"

const LAYOUT_KEY = "ssp_leads_layout"

const NAV_ITEMS: { id: View; label: string; Icon: typeof IconLeads }[] = [
    { id: "leads", label: "Leads", Icon: IconLeads },
    { id: "stats", label: "Analytics", Icon: IconStats },
]

export default function Dashboard() {
    const [authed, setAuthed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [view, setView] = useState<View>("leads")
    const [leadsLayout, setLeadsLayout] = useState<LeadsLayout>("list")
    const [layoutReady, setLayoutReady] = useState(false)
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

        const saved = localStorage.getItem(LAYOUT_KEY) as LeadsLayout | null
        if (saved === "pipeline" || saved === "list") {
            setLeadsLayout(saved)
        } else {
            setLeadsLayout(window.innerWidth >= 768 ? "pipeline" : "list")
        }
        setLayoutReady(true)
    }, [])

    const showToast = useCallback((msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(""), 2800)
    }, [])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const useStatusFilter =
                view === "leads" && leadsLayout === "list" && statusFilter !== "all"

            const [leadsData, statsData] = await Promise.all([
                fetchLeads({
                    status: useStatusFilter ? statusFilter : undefined,
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
    }, [view, leadsLayout, statusFilter, search])

    useEffect(() => {
        if (authed && layoutReady) loadData()
    }, [authed, layoutReady, loadData])

    useEffect(() => {
        if (!authed) return
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [authed, loadData])

    const handleLeadUpdate = (updated: Lead) => {
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
        if (selectedLead?.id === updated.id) setSelectedLead(updated)
        fetchStats().then(setStats).catch(() => {})
        showToast(`Updated ${updated.fullname.split(" ")[0]}`)
    }

    const handleLeadDelete = useCallback(
        async (lead: Lead) => {
            const firstName = lead.fullname.split(" ")[0]
            if (
                !window.confirm(
                    `Delete ${lead.fullname}? This permanently removes them from your leads.`
                )
            ) {
                return
            }

            try {
                await deleteLead(lead.id)
                setLeads((prev) => prev.filter((l) => l.id !== lead.id))
                if (selectedLead?.id === lead.id) setSelectedLead(null)
                fetchStats().then(setStats).catch(() => {})
                showToast(`Deleted ${firstName}`)
            } catch {
                showToast("Failed to delete lead")
            }
        },
        [selectedLead, showToast]
    )

    const followUpAlerts = useMemo(() => getFollowUpAlerts(leads), [leads])
    const alertKinds = useMemo(
        () => new Map(followUpAlerts.map((a) => [a.lead.id, a.kind])),
        [followUpAlerts]
    )
    const alertCount = followUpAlerts.length

    if (!mounted) {
        return (
            <div className="app-loading">
                <div className="spinner" />
            </div>
        )
    }
    if (!authed) return <Login onLogin={() => setAuthed(true)} />

    const newCount = stats?.byStatus.new || 0
    const badgeCount = Math.max(newCount, alertCount)

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="sidebar__brand">
                    <div className="sidebar__logo">
                        <IconSun />
                    </div>
                    <div>
                        <div className="sidebar__name">{config.appName}</div>
                        <div className="sidebar__tag">{config.appSubtitle}</div>
                    </div>
                </div>

                <nav className="sidebar__nav">
                    {NAV_ITEMS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            className={`sidebar__link ${view === id ? "sidebar__link--active" : ""}`}
                            onClick={() => setView(id)}
                        >
                            <Icon />
                            <span>{label}</span>
                            {id === "leads" && badgeCount > 0 && (
                                <span className="sidebar__badge">{badgeCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <button
                    className="sidebar__logout"
                    onClick={() => {
                        logout()
                        setAuthed(false)
                    }}
                >
                    <IconLogout />
                    Sign out
                </button>
            </aside>

            <div className="main">
                <header className="topbar">
                    <div className="topbar__left">
                        <div className="topbar__mobile-brand">
                            <IconSun />
                            <span>{config.appName}</span>
                        </div>
                        <h1 className="topbar__title">
                            {view === "leads" && "Leads"}
                            {view === "stats" && "Analytics"}
                        </h1>
                        {stats && view === "leads" && (
                            <p className="topbar__subtitle">
                                {stats.total} total · {stats.today} today
                                {alertCount > 0 && ` · ${alertCount} need attention`}
                            </p>
                        )}
                    </div>
                    <div className="topbar__actions">
                        {view === "leads" && (
                            <div className="view-toggle">
                                <button
                                    className={`view-toggle__btn ${leadsLayout === "pipeline" ? "view-toggle__btn--active" : ""}`}
                                    onClick={() => {
                                        setLeadsLayout("pipeline")
                                        localStorage.setItem(LAYOUT_KEY, "pipeline")
                                    }}
                                    title="Pipeline view"
                                >
                                    <IconPipeline />
                                    <span>Board</span>
                                </button>
                                <button
                                    className={`view-toggle__btn ${leadsLayout === "list" ? "view-toggle__btn--active" : ""}`}
                                    onClick={() => {
                                        setLeadsLayout("list")
                                        localStorage.setItem(LAYOUT_KEY, "list")
                                    }}
                                    title="List view"
                                >
                                    <IconList />
                                    <span>List</span>
                                </button>
                            </div>
                        )}
                        <button
                            className="topbar__refresh btn-ghost"
                            onClick={loadData}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </header>

                {view === "leads" && (
                    <ActionAlerts
                        alerts={followUpAlerts}
                        onSelect={setSelectedLead}
                    />
                )}

                <div className={`content ${view === "leads" && leadsLayout === "pipeline" ? "content--wide" : ""}`}>
                    {stats && view === "leads" && (
                        <StatsOverview stats={stats} compact={leadsLayout === "pipeline"} />
                    )}

                    {view === "stats" ? (
                        stats ? (
                            <StatsView stats={stats} />
                        ) : (
                            <div className="loading-state">
                                <div className="spinner" />
                            </div>
                        )
                    ) : leadsLayout === "pipeline" ? (
                        loading ? (
                            <div className="loading-state">
                                <div className="spinner" />
                                <p>Loading pipeline...</p>
                            </div>
                        ) : (
                            <>
                                <div className="toolbar toolbar--pipeline">
                                    <div className="search-input">
                                        <IconSearch />
                                        <input
                                            type="search"
                                            placeholder="Search leads..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <PipelineBoard
                                    leads={leads}
                                    onSelect={setSelectedLead}
                                    onLeadUpdate={handleLeadUpdate}
                                    onLeadDelete={handleLeadDelete}
                                    showToast={showToast}
                                    alertKinds={alertKinds}
                                />
                            </>
                        )
                    ) : (
                        <>
                            <div className="leads-controls">
                                <div className="toolbar">
                                    <div className="search-input">
                                        <IconSearch />
                                        <input
                                            type="search"
                                            placeholder="Search leads..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="filter-pills">
                                    <button
                                        className={`pill ${statusFilter === "all" ? "pill--active" : ""}`}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All
                                    </button>
                                    {PIPELINE_STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            className={`pill ${statusFilter === s ? "pill--active" : ""}`}
                                            onClick={() => setStatusFilter(s)}
                                            style={
                                                statusFilter === s
                                                    ? {
                                                          background: STATUS_CONFIG[s].bg,
                                                          color: STATUS_CONFIG[s].color,
                                                          borderColor: STATUS_CONFIG[s].color,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {STATUS_CONFIG[s].label}
                                            {stats ? ` ${stats.byStatus[s] || 0}` : ""}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner" />
                                    <p>Loading leads...</p>
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__icon">☀️</div>
                                    <h3>No leads found</h3>
                                    <p>New inquiries from your website will appear here.</p>
                                </div>
                            ) : (
                                <div className="leads-grid">
                                    {leads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onClick={() => setSelectedLead(lead)}
                                            onStatusChange={handleLeadUpdate}
                                            onDelete={handleLeadDelete}
                                            alertKind={followUpAlerts.find((a) => a.lead.id === lead.id)?.kind}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <nav className="mobile-nav">
                {NAV_ITEMS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        className={`mobile-nav__item ${view === id ? "mobile-nav__item--active" : ""}`}
                        onClick={() => setView(id)}
                    >
                        <Icon />
                        <span>{label}</span>
                        {id === "leads" && badgeCount > 0 && (
                            <span className="mobile-nav__badge">{badgeCount}</span>
                        )}
                    </button>
                ))}
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
