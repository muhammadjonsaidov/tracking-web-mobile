import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, getBaseUrl, setBaseUrl, unwrap } from "../api";
import { AuthView } from "../components/AuthView";
import { useAuth } from "../context/AuthContext";
import type { AuthResponse } from "../types";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const [usernameOrEmail, setU] = useState("");
    const [password, setP] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [baseUrl, setBaseUrlState] = useState(() => getBaseUrl());
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    function applyBaseUrl() {
        const value = baseUrl.trim();
        if (!value) {
            setErr("Base URL is empty.");
            return;
        }
        setBaseUrl(value);
        setBaseUrlState(getBaseUrl());
        setInfo(`Base URL set: ${getBaseUrl()}`);
    }

    async function doRegister(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setInfo(null);
        try {
            await unwrap<any>(
                api.post("/api/v1/auth/register", {
                    username: regUsername,
                    email: regEmail,
                    password: regPassword,
                })
            );
            setInfo("Registered. Please login.");
            navigate("/login");
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Register failed";
            setErr(m);
        }
    }

    async function doLogin(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setInfo(null);
        try {
            const data = await unwrap<AuthResponse>(
                api.post("/api/v1/auth/login", { usernameOrEmail, password })
            );
            setAuth(data.accessToken, data.tokenType);
            navigate("/dashboard");
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Login failed";
            setErr(m);
        }
    }

    return (
        <AuthView
            authMode={mode}
            onAuthModeChange={(next) => navigate(next === "login" ? "/login" : "/register")}
            baseUrl={baseUrl}
            onBaseUrlChange={setBaseUrlState}
            onApplyBaseUrl={applyBaseUrl}
            usernameOrEmail={usernameOrEmail}
            password={password}
            regUsername={regUsername}
            regEmail={regEmail}
            regPassword={regPassword}
            onLoginSubmit={doLogin}
            onRegisterSubmit={doRegister}
            onUsernameOrEmailChange={setU}
            onPasswordChange={setP}
            onRegUsernameChange={setRegUsername}
            onRegEmailChange={setRegEmail}
            onRegPasswordChange={setRegPassword}
            error={err}
            info={info}
        />
    );
}
