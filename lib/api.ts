import { config } from "./config"
import type { Lead, LeadStats } from "./types"

function getApiKey(): string {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(config.storageKey) || ""
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${config.apiUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getApiKey()}`,
            ...(options.headers || {}),
        },
    })

    if (response.status === 401) {
        localStorage.removeItem(config.storageKey)
        throw new Error("UNAUTHORIZED")
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Request failed")
    }

    return response.json()
}

export async function fetchLeads(params?: {
    status?: string
    source?: string
    search?: string
}): Promise<Lead[]> {
    const query = new URLSearchParams()
    if (params?.status) query.set("status", params.status)
    if (params?.source) query.set("source", params.source)
    if (params?.search) query.set("search", params.search)

    const qs = query.toString()
    const data = await request<{ leads: Lead[] }>(`/leads${qs ? `?${qs}` : ""}`)
    return data.leads
}

export async function fetchLead(id: string): Promise<Lead> {
    const data = await request<{ lead: Lead }>(`/leads/${id}`)
    return data.lead
}

export async function fetchStats(): Promise<LeadStats> {
    return request<LeadStats>("/leads/stats")
}

export async function updateLead(
    id: string,
    updates: Partial<Pick<Lead, "status" | "notes" | "priority" | "assignedTo">>
): Promise<Lead> {
    const data = await request<{ lead: Lead }>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    })
    return data.lead
}

export async function regenerateMessage(
    id: string,
    status?: string
): Promise<Lead> {
    const data = await request<{ lead: Lead }>(`/leads/${id}/regenerate-message`, {
        method: "POST",
        body: JSON.stringify({ status }),
    })
    return data.lead
}

export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!getApiKey()
}

export function login(apiKey: string): void {
    localStorage.setItem(config.storageKey, apiKey)
}

export function logout(): void {
    localStorage.removeItem(config.storageKey)
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
    const response = await fetch(`${config.apiUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    return response.ok
}
