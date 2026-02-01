import { useEffect, useState } from "react";
import { api } from "../api";
import { HistoryView } from "../components/HistoryView";
import { useAuth } from "../context/AuthContext";
import { approxDistanceM, getPathBounds, getPathCenter } from "../utils/geo";
import type { PointRow, PointsResponse, SessionRow } from "../types";

export function HistoryPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [detailsById, setDetailsById] = useState<Record<string, SessionDetails>>({});
    const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
    const [detailError, setDetailError] = useState<Record<string, string | null>>({});

    const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];

    type SessionDetails = {
        points: PointRow[];
        path: [number, number][];
        center: [number, number];
        bounds?: [[number, number], [number, number]] | null;
        marker?: { lat: number; lon: number; accuracyM?: number | null } | null;
        distanceM: number;
        durationMs: number | null;
        truncated?: boolean;
        total?: number;
        lastTs?: string | null;
    };

    function parseMs(value?: string | null) {
        if (!value) return null;
        const ts = Date.parse(value);
        return Number.isNaN(ts) ? null : ts;
    }

    function computeDurationMs(session: SessionRow, points: PointRow[]) {
        const startMs = parseMs(session.startTime);
        const stopMs = parseMs(session.stopTime);
        if (startMs != null && stopMs != null) return Math.max(0, stopMs - startMs);
        const first = parseMs(points[0]?.ts ?? null);
        const last = parseMs(points[points.length - 1]?.ts ?? null);
        if (first != null && last != null) return Math.max(0, last - first);
        return null;
    }

    function buildPath(points: PointRow[]) {
        return points
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
            .map((p) => [p.lat, p.lon] as [number, number]);
    }

    async function loadHistory() {
        if (!token) return;
        setLoading(true);
        setErr(null);
        try {
            const res = await api.get("/api/v1/tracking/sessions");
            const payload = res?.data;
            if (typeof payload === "string") {
                setErr("History response is not JSON (check Base URL).");
                setHistory([]);
                return;
            }
            const data = payload?.data;
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.content)
                        ? data.content
                        : [];
            if (list.length === 0 && data != null) {
                setErr("History list is empty for this user.");
            }
            setHistory(list);
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Failed to load history";
            setErr(m);
        } finally {
            setLoading(false);
        }
    }

    async function loadSessionDetails(session: SessionRow, force = false) {
        if (!token) return;
        const id = session.sessionId;
        if (!id) return;
        if (!force && detailsById[id]) return;

        setDetailLoading((prev) => ({ ...prev, [id]: true }));
        setDetailError((prev) => ({ ...prev, [id]: null }));

        try {
            const res = await api.get(`/api/v1/tracking/sessions/${id}/points`, {
                params: {
                    max: 2000,
                    downsample: false,
                    simplifyEpsM: 0,
                },
            });
            const payload = res?.data;
            if (typeof payload === "string") {
                setDetailError((prev) => ({ ...prev, [id]: "Session points is not JSON (check Base URL)." }));
                return;
            }

            const data = payload?.data as PointsResponse | undefined;
            const points = Array.isArray(data?.points) ? data.points : [];
            const total = data?.total ?? points.length;
            const truncated = data?.truncated ?? false;

            const rawPath = buildPath(points);
            const path = rawPath;
            const bounds = getPathBounds(path);
            const center = getPathCenter(path) ?? DEFAULT_CENTER;
            const lastPoint = points[points.length - 1];
            const marker = lastPoint
                ? { lat: lastPoint.lat, lon: lastPoint.lon, accuracyM: lastPoint.accuracyM ?? null }
                : null;

            let distanceM = 0;
            for (let i = 1; i < rawPath.length; i += 1) {
                distanceM += approxDistanceM(
                    rawPath[i - 1][0],
                    rawPath[i - 1][1],
                    rawPath[i][0],
                    rawPath[i][1]
                );
            }

            const details: SessionDetails = {
                points,
                path,
                center,
                bounds,
                marker,
                distanceM,
                durationMs: computeDurationMs(session, points),
                truncated,
                total,
                lastTs: lastPoint?.ts ?? null,
            };

            setDetailsById((prev) => ({ ...prev, [id]: details }));
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Failed to load session points";
            setDetailError((prev) => ({ ...prev, [id]: m }));
        } finally {
            setDetailLoading((prev) => ({ ...prev, [id]: false }));
        }
    }

    function toggleSession(session: SessionRow) {
        const id = session.sessionId;
        if (!id) return;
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        loadSessionDetails(session).catch(() => {});
    }

    useEffect(() => {
        loadHistory().catch(() => {});
    }, [token]);

    useEffect(() => {
        function onFocus() {
            loadHistory().catch(() => {});
        }
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    return (
        <HistoryView
            history={history}
            loading={loading}
            onRefresh={loadHistory}
            error={err}
            expandedId={expandedId}
            detailsById={detailsById}
            detailLoading={detailLoading}
            detailError={detailError}
            onToggle={toggleSession}
            onReload={(session) => loadSessionDetails(session, true)}
        />
    );
}
