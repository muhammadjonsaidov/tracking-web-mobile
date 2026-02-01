import axios from "axios";

const TOKEN_KEY = "tracker_web_token";
const TOKEN_TYPE_KEY = "tracker_web_token_type";
const BASE_URL_KEY = "tracker_web_base_url";

function normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, "");
}

export function getBaseUrl(): string {
    const stored = localStorage.getItem(BASE_URL_KEY);
    const env = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const value = stored ?? env ?? "";
    return value ? normalizeBaseUrl(value) : "";
}

export function setBaseUrl(url: string | null) {
    if (url && url.trim().length > 0) {
        localStorage.setItem(BASE_URL_KEY, normalizeBaseUrl(url));
    } else {
        localStorage.removeItem(BASE_URL_KEY);
    }
    api.defaults.baseURL = getBaseUrl();
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getTokenType(): string | null {
    return localStorage.getItem(TOKEN_TYPE_KEY);
}

export function setTokenType(t: string | null) {
    if (t) localStorage.setItem(TOKEN_TYPE_KEY, t);
    else localStorage.removeItem(TOKEN_TYPE_KEY);
}

export function setToken(t: string | null, tokenType?: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);

    if (tokenType !== undefined) {
        setTokenType(tokenType);
    } else if (!t) {
        setTokenType(null);
    }
}

export const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 15000,
});

function uuid(): string {
    // secure contexts’da bor; fallback ham bor
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        const tokenType = getTokenType() ?? "Bearer";
        config.headers.Authorization = `${tokenType} ${token}`;
    }
    // Avoid ngrok browser warning HTML responses in XHR/fetch
    config.headers["ngrok-skip-browser-warning"] = "1";
    config.headers["X-Correlation-Id"] = uuid();
    return config;
});

// ApiResponse wrapper helper
export async function unwrap<T>(p: Promise<any>): Promise<T> {
    const res = await p;
    return res.data?.data as T;
}
