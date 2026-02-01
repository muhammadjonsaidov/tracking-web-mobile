import type { FormEvent } from "react";

export function AuthView({
    authMode,
    onAuthModeChange,
    baseUrl,
    onBaseUrlChange,
    onApplyBaseUrl,
    usernameOrEmail,
    password,
    regUsername,
    regEmail,
    regPassword,
    onLoginSubmit,
    onRegisterSubmit,
    onUsernameOrEmailChange,
    onPasswordChange,
    onRegUsernameChange,
    onRegEmailChange,
    onRegPasswordChange,
    error,
    info,
}: {
    authMode: "login" | "register";
    onAuthModeChange: (mode: "login" | "register") => void;
    baseUrl: string;
    onBaseUrlChange: (value: string) => void;
    onApplyBaseUrl: () => void;
    usernameOrEmail: string;
    password: string;
    regUsername: string;
    regEmail: string;
    regPassword: string;
    onLoginSubmit: (event: FormEvent) => void;
    onRegisterSubmit: (event: FormEvent) => void;
    onUsernameOrEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onRegUsernameChange: (value: string) => void;
    onRegEmailChange: (value: string) => void;
    onRegPasswordChange: (value: string) => void;
    error?: string | null;
    info?: string | null;
}) {
    return (
        <div className="auth-layout">
            <div className="auth-hero">
                <div>
                    <h2>Bring your field team online</h2>
                    <p>
                        Sign in to start a live tracking session, capture movement in real-time, and review
                        your recent sessions.
                    </p>
                </div>
                <div className="hint">Secure HTTPS is required for geolocation.</div>
            </div>

            <div className="card">
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                        onClick={() => onAuthModeChange("login")}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                        onClick={() => onAuthModeChange("register")}
                    >
                        Register
                    </button>
                </div>

                <div className="grid two">
                    <input
                        className="input"
                        placeholder="Backend base URL"
                        value={baseUrl}
                        onChange={(e) => onBaseUrlChange(e.target.value)}
                    />
                    <button className="button secondary" onClick={onApplyBaseUrl}>
                        Save connection
                    </button>
                </div>
                <div className="hint">Example: https://xxxx.ngrok-free.app</div>

                {authMode === "login" ? (
                    <form onSubmit={onLoginSubmit} className="grid two" style={{ marginTop: 16 }}>
                        <input
                            className="input"
                            placeholder="username or email"
                            value={usernameOrEmail}
                            onChange={(e) => onUsernameOrEmailChange(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="password"
                            type="password"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                        />
                        <button className="button" type="submit">
                            Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onRegisterSubmit} className="grid two" style={{ marginTop: 16 }}>
                        <input
                            className="input"
                            placeholder="username"
                            value={regUsername}
                            onChange={(e) => onRegUsernameChange(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="email"
                            value={regEmail}
                            onChange={(e) => onRegEmailChange(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="password"
                            type="password"
                            value={regPassword}
                            onChange={(e) => onRegPasswordChange(e.target.value)}
                        />
                        <button className="button" type="submit">
                            Create account
                        </button>
                    </form>
                )}

                {error && <div className="error">{error}</div>}
                {info && <div className="success">{info}</div>}
            </div>
        </div>
    );
}
