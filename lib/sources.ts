import type { LeadStats } from "./types"

/** Canonical lead source ids — add new site funnels here as you launch them. */
export const SOURCE_DEFINITIONS = {
    facebook: {
        id: "facebook",
        label: "Facebook",
        color: "#1d4ed8",
        bg: "#eff6ff",
        border: "#bfdbfe",
    },
    phone: {
        id: "phone",
        label: "Phone",
        color: "#047857",
        bg: "#ecfdf5",
        border: "#a7f3d0",
    },
    website: {
        id: "website",
        label: "Website",
        color: "#475569",
        bg: "#f1f5f9",
        border: "#cbd5e1",
    },
    campaign: {
        id: "campaign",
        label: "Campaign",
        color: "#7c3aed",
        bg: "#f3e8ff",
        border: "#ddd6fe",
    },
    "speedy-estimate": {
        id: "speedy-estimate",
        label: "Speedy Estimate",
        color: "#0369a1",
        bg: "#e0f2fe",
        border: "#bae6fd",
    },
    "fb-estimate": {
        id: "fb-estimate",
        label: "FB Estimate",
        color: "#1d4ed8",
        bg: "#eff6ff",
        border: "#bfdbfe",
    },
} as const

export type KnownSourceId = keyof typeof SOURCE_DEFINITIONS

export interface SourceTheme {
    id: string
    label: string
    color: string
    bg: string
    border: string
}

export interface SourceFilterOption {
    id: string
    label: string
    count?: number
    theme: SourceTheme
}

const DEFAULT_THEME: SourceTheme = {
    id: "unknown",
    label: "Other",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
}

export function getSourceTheme(source?: string | null): SourceTheme {
    const id = (source || "website").toLowerCase()
    const known = SOURCE_DEFINITIONS[id as KnownSourceId]
    if (known) return known

    return {
        ...DEFAULT_THEME,
        id,
        label: formatSourceLabel(source),
    }
}

export function formatSourceLabel(source?: string | null): string {
    const id = (source || "website").toLowerCase()
    const known = SOURCE_DEFINITIONS[id as KnownSourceId]
    if (known) return known.label

    if (!source) return "Website"

    return source
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

/** Preferred display order for common sources; unknown sources sort by count. */
const SOURCE_ORDER: string[] = [
    "facebook",
    "phone",
    "website",
    "fb-estimate",
    "speedy-estimate",
    "campaign",
]

export function buildSourceFilterOptions(stats: LeadStats | null): SourceFilterOption[] {
    const allOption: SourceFilterOption = {
        id: "all",
        label: "All sources",
        count: stats?.total ?? 0,
        theme: {
            id: "all",
            label: "All sources",
            color: "#068DD4",
            bg: "#E8F6FC",
            border: "#068DD4",
        },
    }

    if (!stats) {
        return [
            allOption,
            ...SOURCE_ORDER.filter((id) => id in SOURCE_DEFINITIONS).map((id) => ({
                id,
                label: SOURCE_DEFINITIONS[id as KnownSourceId].label,
                theme: SOURCE_DEFINITIONS[id as KnownSourceId],
            })),
        ]
    }

    const entries = Object.entries(stats.bySource).sort((a, b) => {
        const orderA = SOURCE_ORDER.indexOf(a[0])
        const orderB = SOURCE_ORDER.indexOf(b[0])
        if (orderA !== -1 && orderB !== -1) return orderA - orderB
        if (orderA !== -1) return -1
        if (orderB !== -1) return 1
        return b[1] - a[1]
    })

    return [
        allOption,
        ...entries.map(([id, count]) => ({
            id,
            label: formatSourceLabel(id),
            count,
            theme: getSourceTheme(id),
        })),
    ]
}

export function getActiveSourceLabel(
    sourceFilter: string,
    options: SourceFilterOption[]
): string | null {
    if (sourceFilter === "all") return null
    return options.find((option) => option.id === sourceFilter)?.label || formatSourceLabel(sourceFilter)
}
