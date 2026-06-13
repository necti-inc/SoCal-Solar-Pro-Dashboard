export type LeadStatus =
    | "new"
    | "contacted"
    | "follow_up"
    | "qualified"
    | "scheduled"
    | "won"
    | "lost"

export interface Lead {
    id: string
    fullname: string
    phonenumber: string
    email: string
    homeaddress: string
    city: string
    zipcode: string
    numberofpanels: number
    stories: string
    price: number
    travelDistanceInMiles?: number
    travelDuration?: string
    status: LeadStatus
    priority: string
    source: string
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
    notes: string
    assignedTo?: string | null
    lastContactedAt?: string | null
    generatedMessage?: string | null
    messageGeneratedAt?: string | null
    messageStatus?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface LeadStats {
    total: number
    byStatus: Record<string, number>
    bySource: Record<string, number>
    today: number
    thisWeek: number
}

export const STATUS_CONFIG: Record<
    LeadStatus,
    { label: string; color: string; bg: string }
> = {
    new: { label: "New", color: "#068DD4", bg: "#E8F6FC" },
    contacted: { label: "Contacted", color: "#7C3AED", bg: "#F3E8FF" },
    follow_up: { label: "Follow Up", color: "#D97706", bg: "#FEF3C7" },
    qualified: { label: "Qualified", color: "#059669", bg: "#D1FAE5" },
    scheduled: { label: "Scheduled", color: "#2563EB", bg: "#DBEAFE" },
    won: { label: "Won", color: "#16A34A", bg: "#DCFCE7" },
    lost: { label: "Lost", color: "#6B7280", bg: "#F3F4F6" },
}

export const PIPELINE_STATUSES: LeadStatus[] = [
    "new",
    "contacted",
    "follow_up",
    "qualified",
    "scheduled",
    "won",
    "lost",
]
