"use client"

import { useState } from "react"
import { login, verifyApiKey } from "@/lib/api"
import { config } from "@/lib/config"

interface LoginProps {
    onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) return

        setLoading(true)
        setError("")

        try {
            const valid = await verifyApiKey(password.trim())
            if (!valid) throw new Error()
            login(password.trim())
            onLogin()
        } catch {
            setError("Incorrect password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-screen">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1>{config.appName}</h1>
                <p>Sign in to your {config.appSubtitle.toLowerCase()}</p>

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    autoFocus
                />

                {error && <p className="login-error">{error}</p>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 20 }}
                    disabled={loading || !password.trim()}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </div>
    )
}
