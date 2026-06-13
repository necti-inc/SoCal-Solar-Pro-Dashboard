"use client"

import { useState } from "react"
import { login, verifyApiKey } from "@/lib/api"
import { config } from "@/lib/config"

interface LoginProps {
    onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
    const [apiKey, setApiKey] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!apiKey.trim()) return

        setLoading(true)
        setError("")

        try {
            const valid = await verifyApiKey(apiKey.trim())
            if (!valid) throw new Error()
            login(apiKey.trim())
            onLogin()
        } catch {
            setError("Invalid access key. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-screen">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1>{config.appName}</h1>
                <p>Sign in to your {config.appSubtitle.toLowerCase()}</p>

                <label htmlFor="apiKey">Team Access Key</label>
                <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your access key"
                    autoComplete="current-password"
                    autoFocus
                />

                {error && <p className="login-error">{error}</p>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 20 }}
                    disabled={loading || !apiKey.trim()}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </div>
    )
}
