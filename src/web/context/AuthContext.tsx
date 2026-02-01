import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getToken, getTokenType, setToken } from "../api";

type AuthContextValue = {
    token: string | null;
    tokenType: string | null;
    setAuth: (token: string, tokenType?: string | null) => void;
    clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [tokenState, setTokenState] = useState<string | null>(() => getToken());
    const [tokenTypeState, setTokenTypeState] = useState<string | null>(() => getTokenType());

    const value = useMemo<AuthContextValue>(
        () => ({
            token: tokenState,
            tokenType: tokenTypeState,
            setAuth: (token, tokenType) => {
                setToken(token, tokenType);
                setTokenState(token);
                setTokenTypeState(tokenType ?? null);
            },
            clearAuth: () => {
                setToken(null);
                setTokenState(null);
                setTokenTypeState(null);
            },
        }),
        [tokenState, tokenTypeState]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
