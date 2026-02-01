import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, MapPin, Clock, Route as RouteIcon } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { api } from '@/shared/api/client';
import { useAuth } from '@/features/auth/model/AuthContext';
import { approxDistanceM, getPathBounds, getPathCenter } from '@/shared/utils/geo';
import { formatDate, formatDurationMs } from '@/shared/utils/time';
import type { PointRow, PointsResponse, SessionRow } from '@/shared/types';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export function HistoryPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [detailsById, setDetailsById] = useState<Record<string, SessionDetails>>({});
    const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
    const [detailError, setDetailError] = useState<Record<string, string | null>>({});

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
            const res = await api.get('/api/v1/tracking/sessions');
            const payload = res?.data;
            if (typeof payload === 'string') {
                setErr('History response is not JSON (check Base URL).');
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
                setErr('History list is empty for this user.');
            }
            setHistory(list);
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? 'Failed to load history';
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
            if (typeof payload === 'string') {
                setDetailError((prev) => ({ ...prev, [id]: 'Session points is not JSON (check Base URL).' }));
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
                distanceM += approxDistanceM(rawPath[i - 1][0], rawPath[i - 1][1], rawPath[i][0], rawPath[i][1]);
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
            const m = ex?.response?.data?.message ?? 'Failed to load session points';
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
        loadSessionDetails(session).catch(() => { });
    }

    useEffect(() => {
        loadHistory().catch(() => { });
    }, [token]);

    useEffect(() => {
        function onFocus() {
            loadHistory().catch(() => { });
        }
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-primary-600" />
                            Session History
                        </CardTitle>
                        <Button variant="secondary" size="sm" onClick={loadHistory} isLoading={loading}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {err && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                            {err}
                        </div>
                    )}

                    {loading && history.length === 0 && (
                        <div className="text-center py-8 text-gray-500">Loading sessions...</div>
                    )}

                    {!loading && history.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No sessions found.</div>
                    )}

                    <div className="space-y-3">
                        {history.map((session) => {
                            const id = session.sessionId;
                            const isExpanded = expandedId === id;
                            const details = detailsById[id];
                            const isDetailLoading = detailLoading[id];
                            const detailErr = detailError[id];

                            return (
                                <Card key={id} variant="soft" className="overflow-hidden">
                                    <button
                                        onClick={() => toggleSession(session)}
                                        className="w-full p-4 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="font-mono text-sm text-gray-600 mb-1">{id}</div>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {session.startTime ? formatDate(session.startTime) : 'N/A'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200">
                                                    {session.status || 'UNKNOWN'}
                                                </span>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-200 p-4 space-y-4 animate-slide-up">
                                            {isDetailLoading && <div className="text-sm text-gray-500">Loading details...</div>}
                                            {detailErr && <div className="text-sm text-red-600">{detailErr}</div>}

                                            {details && (
                                                <>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-3 bg-white rounded-lg">
                                                            <RouteIcon className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                                                            <div className="text-xs text-gray-500">Distance</div>
                                                            <div className="text-sm font-bold">{(details.distanceM / 1000).toFixed(2)} km</div>
                                                        </div>
                                                        <div className="text-center p-3 bg-white rounded-lg">
                                                            <Clock className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                                                            <div className="text-xs text-gray-500">Duration</div>
                                                            <div className="text-sm font-bold">
                                                                {details.durationMs ? formatDurationMs(details.durationMs) : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-center p-3 bg-white rounded-lg">
                                                            <MapPin className="w-5 h-5 mx-auto mb-1 text-green-600" />
                                                            <div className="text-xs text-gray-500">Points</div>
                                                            <div className="text-sm font-bold">{details.total ?? details.points.length}</div>
                                                        </div>
                                                    </div>

                                                    {details.path.length > 0 && (
                                                        <div className="h-64 rounded-lg overflow-hidden">
                                                            <MapContainer
                                                                center={details.center}
                                                                zoom={13}
                                                                className="h-full w-full"
                                                            >
                                                                <TileLayer
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                <Polyline
                                                                    positions={details.path as LatLngExpression[]}
                                                                    pathOptions={{ color: '#0ea5e9', weight: 3 }}
                                                                />
                                                                {details.marker && (
                                                                    <Marker position={[details.marker.lat, details.marker.lon] as LatLngExpression} />
                                                                )}
                                                            </MapContainer>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
