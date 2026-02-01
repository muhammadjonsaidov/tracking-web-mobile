import { useEffect, useMemo, useRef, useState } from "react";
import { api, unwrap } from "../api";
import { LogsCard } from "../components/LogsCard";
import { MapCard } from "../components/MapCard";
import { SessionControlPanel } from "../components/SessionControlPanel";
import { StatsDock } from "../components/StatsDock";
import { useAuth } from "../context/AuthContext";
import { useNetworkInfo } from "../hooks/useNetworkInfo";
import { useNowTicker } from "../hooks/useNowTicker";
import { approxDistanceM, formatCoords, simplifyRdp, smoothPath } from "../utils/geo";
import { nowIsoUtc, uuid } from "../utils/id";
import { formatDate, formatDurationMs } from "../utils/time";
import type { AvgBucket, IngestResponse, Metric, ProviderType, QueuedPoint, StartSessionResponse } from "../types";

const SESSION_KEY = "tracker_web_session_id";
const SESSION_START_KEY = "tracker_web_session_start";
const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];
const MAX_PATH_POINTS = 1500;
const MIN_PATH_DISTANCE_M = 5;
const AVG_WINDOW_MS = 3000;
const MAX_POINTS_PER_MIN = 6000;

export function DashboardPage() {
    const { token, tokenType } = useAuth();

    const initialSessionId = localStorage.getItem(SESSION_KEY);
    const initialSessionStart = localStorage.getItem(SESSION_START_KEY);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
    const [sessionStartIso, setSessionStartIso] = useState<string | null>(initialSessionStart);
    const [tracking, setTracking] = useState(!!initialSessionId);
    const [watching, setWatching] = useState(false);
    const [toggleBusy, setToggleBusy] = useState(false);

    const batchSize = 50;
    const flushIntervalSec = 8;
    const distanceFilterM = 10;
    const highAccuracy = true;
    const accuracyFilterM = 80;
    const provider: ProviderType = "gps";

    const watchIdRef = useRef<number | null>(null);
    const flushTimerRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(initialSessionId);
    const queueRef = useRef<QueuedPoint[]>([]);
    const lastPointRef = useRef<QueuedPoint | null>(null);
    const lastPosRef = useRef<GeolocationPosition | null>(null);
    const flushInFlightRef = useRef(false);
    const avgBucketRef = useRef<AvgBucket | null>(null);
    const firstPointSentRef = useRef(false);
    const rateWindowRef = useRef({ startMs: 0, count: 0 });
    const pathRef = useRef<[number, number][]>([]);
    const totalDistanceRef = useRef(0);

    const [queueSizeUi, setQueueSizeUi] = useState(0);
    const [lastPosUi, setLastPosUi] = useState<GeolocationPosition | null>(null);
    const [lastSentAt, setLastSentAt] = useState<string | null>(null);
    const [pathPoints, setPathPoints] = useState<[number, number][]>([]);
    const [routeDistanceM, setRouteDistanceM] = useState(0);

    const [log, setLog] = useState<string[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const networkInfo = useNetworkInfo();
    const nowTick = useNowTicker(!!sessionStartIso && tracking);

    const canGeo = useMemo(() => typeof navigator !== "undefined" && !!navigator.geolocation, []);

    useEffect(() => {
        setTracking(!!sessionId);
    }, [sessionId]);

    function pushLog(msg: string) {
        setLog((prev) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...prev].slice(0, 80));
    }

    function persistSession(id: string | null) {
        if (id) localStorage.setItem(SESSION_KEY, id);
        else localStorage.removeItem(SESSION_KEY);
        setSessionId(id);
        sessionIdRef.current = id;
    }

    function persistSessionStart(iso: string | null) {
        if (iso) localStorage.setItem(SESSION_START_KEY, iso);
        else localStorage.removeItem(SESSION_START_KEY);
        setSessionStartIso(iso);
    }

    function updateQueueUi() {
        setQueueSizeUi(queueRef.current.length);
    }

    function allowPointInWindow() {
        const now = Date.now();
        if (rateWindowRef.current.startMs === 0 || now - rateWindowRef.current.startMs >= 60000) {
            rateWindowRef.current.startMs = now;
            rateWindowRef.current.count = 0;
        }
        if (rateWindowRef.current.count >= MAX_POINTS_PER_MIN) {
            pushLog("Rate limit guard: skipping point (client).");
            return false;
        }
        rateWindowRef.current.count += 1;
        return true;
    }

    function pushPathPoint(lat: number, lon: number) {
        const last = pathRef.current[pathRef.current.length - 1];
        if (last) {
            const d = approxDistanceM(last[0], last[1], lat, lon);
            if (d < MIN_PATH_DISTANCE_M) return;
            totalDistanceRef.current += d;
            setRouteDistanceM(totalDistanceRef.current);
        } else {
            setRouteDistanceM(totalDistanceRef.current);
        }
        pathRef.current = [...pathRef.current, [lat, lon] as [number, number]].slice(-MAX_PATH_POINTS) as [number, number][];
        setPathPoints(pathRef.current);
    }

    function newBucket(pos: GeolocationPosition): AvgBucket {
        const tsMs = pos.timestamp || Date.now();
        const acc = pos.coords.accuracy ?? null;
        const speed = pos.coords.speed ?? null;
        const heading = pos.coords.heading ?? null;
        return {
            count: 1,
            sumLat: pos.coords.latitude,
            sumLon: pos.coords.longitude,
            sumAcc: acc ?? 0,
            accCount: acc == null ? 0 : 1,
            sumSpeed: speed ?? 0,
            speedCount: speed == null ? 0 : 1,
            sumHeading: heading ?? 0,
            headingCount: heading == null ? 0 : 1,
            firstTsMs: tsMs,
            lastTsMs: tsMs,
        };
    }

    function addToBucket(bucket: AvgBucket, pos: GeolocationPosition) {
        const acc = pos.coords.accuracy ?? null;
        const speed = pos.coords.speed ?? null;
        const heading = pos.coords.heading ?? null;
        bucket.count += 1;
        bucket.sumLat += pos.coords.latitude;
        bucket.sumLon += pos.coords.longitude;
        if (acc != null) {
            bucket.sumAcc += acc;
            bucket.accCount += 1;
        }
        if (speed != null) {
            bucket.sumSpeed += speed;
            bucket.speedCount += 1;
        }
        if (heading != null) {
            bucket.sumHeading += heading;
            bucket.headingCount += 1;
        }
        bucket.lastTsMs = pos.timestamp || Date.now();
    }

    function emitBucket(bucket: AvgBucket) {
        if (!allowPointInWindow()) return;

        const lat = bucket.sumLat / bucket.count;
        const lon = bucket.sumLon / bucket.count;
        const accuracyM = bucket.accCount > 0 ? bucket.sumAcc / bucket.accCount : undefined;
        const speedMps = bucket.speedCount > 0 ? bucket.sumSpeed / bucket.speedCount : undefined;
        const headingDeg = bucket.headingCount > 0 ? bucket.sumHeading / bucket.headingCount : undefined;

        if (accuracyM != null && accuracyM > accuracyFilterM) {
            pushLog(`Skip averaged point (accuracy ${Math.round(accuracyM)}m > ${accuracyFilterM}m)`);
            return;
        }

        const p: QueuedPoint = {
            eventId: uuid(),
            lat,
            lon,
            deviceTimestamp: new Date(bucket.lastTsMs).toISOString(),
            accuracyM: accuracyM ?? null,
            speedMps: speedMps ?? null,
            headingDeg: headingDeg ?? null,
            provider: provider || undefined,
            mock: false,
        };

        const last = lastPointRef.current;
        if (last) {
            const d = approxDistanceM(last.lat, last.lon, p.lat, p.lon);
            if (d < distanceFilterM) {
                return;
            }
        }

        queueRef.current.push(p);
        lastPointRef.current = p;
        pushPathPoint(p.lat, p.lon);
        updateQueueUi();
        flushOnce().catch(() => { });
    }

    function flushAvgBucket(force: boolean) {
        const bucket = avgBucketRef.current;
        if (!bucket) return;
        const age = Date.now() - bucket.firstTsMs;
        if (!force && age < AVG_WINDOW_MS) return;
        emitBucket(bucket);
        avgBucketRef.current = null;
    }

    function startWatchers() {
        if (!canGeo) {
            setErr("Geolocation not supported in this browser.");
            return;
        }
        if (watchIdRef.current != null) return;

        const onPos = (pos: GeolocationPosition) => enqueuePosition(pos);
        const onErr = (e: GeolocationPositionError) => {
            const m = `${e.code}: ${e.message}`;
            setErr(m);
            pushLog(`watchPosition error: ${m}`);
        };

        const id = navigator.geolocation.watchPosition(onPos, onErr, {
            enableHighAccuracy: highAccuracy,
            maximumAge: 0,
            timeout: 20000,
        });

        watchIdRef.current = id;
        setWatching(true);

        navigator.geolocation.getCurrentPosition(onPos, onErr, {
            enableHighAccuracy: highAccuracy,
            maximumAge: 0,
            timeout: 20000,
        });

        if (flushTimerRef.current == null) {
            const t = window.setInterval(() => {
                flushOnce().catch(() => { });
            }, Math.max(2, flushIntervalSec) * 1000);
            flushTimerRef.current = t;
        }
    }

    function stopWatchers() {
        if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (flushTimerRef.current != null) {
            window.clearInterval(flushTimerRef.current);
            flushTimerRef.current = null;
        }
        setWatching(false);
    }

    function enqueuePosition(pos: GeolocationPosition) {
        lastPosRef.current = pos;
        setLastPosUi(pos);

        const acc = pos.coords.accuracy ?? null;
        if (acc != null && acc > accuracyFilterM) {
            pushLog(`Skip point (accuracy ${Math.round(acc)}m > ${accuracyFilterM}m)`);
            return;
        }

        const bucket = avgBucketRef.current;
        if (!bucket) {
            avgBucketRef.current = newBucket(pos);
            if (!firstPointSentRef.current) {
                flushAvgBucket(true);
                firstPointSentRef.current = true;
            }
            return;
        }

        const age = (pos.timestamp || Date.now()) - bucket.firstTsMs;
        if (age >= AVG_WINDOW_MS) {
            emitBucket(bucket);
            avgBucketRef.current = newBucket(pos);
            return;
        }

        addToBucket(bucket, pos);
    }

    async function startTracking() {
        setErr(null);

        if (toggleBusy || (tracking && watching)) return;
        if (!token) {
            setErr("Login first.");
            return;
        }

        setToggleBusy(true);
        try {
            if (sessionIdRef.current) {
                avgBucketRef.current = null;
                firstPointSentRef.current = false;
                startWatchers();
                setTracking(true);
                pushLog(`Session RESUME: ${sessionIdRef.current}`);
                return;
            }

            const data = await unwrap<StartSessionResponse>(
                api.post("/api/v1/tracking/sessions/start")
            );
            persistSession(data.sessionId);
            persistSessionStart(data.startTime ?? nowIsoUtc());
            queueRef.current = [];
            lastPointRef.current = null;
            avgBucketRef.current = null;
            firstPointSentRef.current = false;
            pathRef.current = [];
            setPathPoints([]);
            totalDistanceRef.current = 0;
            setRouteDistanceM(0);
            updateQueueUi();
            setTracking(true);
            pushLog(`Session START: ${data.sessionId}`);
            startWatchers();
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Start session failed";
            setErr(m);
            pushLog(`Start FAIL: ${m}`);
            setTracking(false);
        } finally {
            setToggleBusy(false);
        }
    }

    async function stopTracking() {
        setErr(null);

        if (toggleBusy) return;
        const sid = sessionIdRef.current;
        if (!sid) {
            setTracking(false);
            return;
        }

        setToggleBusy(true);
        let stopOk = false;
        try {
            stopWatchers();

            flushAvgBucket(true);
            for (let i = 0; i < 10; i += 1) {
                if (queueRef.current.length === 0) break;
                await flushOnce();
            }

            const last = lastPosRef.current;
            await unwrap<any>(
                api.post(`/api/v1/tracking/sessions/${sid}/stop`, {
                    stopTime: nowIsoUtc(),
                    stopLat: last?.coords.latitude ?? null,
                    stopLon: last?.coords.longitude ?? null,
                })
            );

            pushLog(`Session STOP: ${sid}`);
            stopOk = true;
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? "Stop failed";
            setErr(m);
            pushLog(`Stop FAIL: ${m}`);
        } finally {
            if (stopOk) {
                persistSession(null);
                persistSessionStart(null);
                queueRef.current = [];
                updateQueueUi();
            } else {
                setTracking(true);
            }
            setToggleBusy(false);
        }
    }

    async function flushOnce() {
        const sid = sessionIdRef.current;
        if (!sid) return;
        if (!token) return;
        if (flushInFlightRef.current) return;

        const q = queueRef.current;
        if (q.length === 0) return;

        const take = q.splice(0, Math.min(batchSize, q.length));
        updateQueueUi();

        flushInFlightRef.current = true;
        try {
            const r = await unwrap<IngestResponse>(
                api.post(`/api/v1/tracking/sessions/${sid}/points`, { points: take })
            );
            setLastSentAt(new Date().toISOString());
            pushLog(`Flush OK: accepted=${r.accepted} inserted=${r.inserted} (sent ${take.length})`);
        } catch (ex: any) {
            queueRef.current = [...take, ...queueRef.current];
            updateQueueUi();

            const code = ex?.response?.status;
            const m = ex?.response?.data?.message ?? "Flush failed";
            pushLog(`Flush FAIL (${code ?? "?"}): ${m}`);

            if (code === 400) {
                setErr("Session is not ACTIVE / invalid. Please restart tracking.");
            }
            if (code === 401 || code === 403) {
                setErr("Unauthorized. Please login again.");
            }
        } finally {
            flushInFlightRef.current = false;
        }
    }

    useEffect(() => {
        function onVis() {
            if (document.visibilityState === "hidden") {
                pushLog("Tab hidden: timers/geolocation may be throttled.");
            }
        }
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    useEffect(() => {
        if (!token) return;
        if (!sessionIdRef.current) return;
        if (watchIdRef.current != null) return;
        startWatchers();
        pushLog(`Session RESUME: ${sessionIdRef.current}`);
    }, [token, sessionId, canGeo]);

    useEffect(() => {
        return () => {
            if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
            if (flushTimerRef.current != null) window.clearInterval(flushTimerRef.current);
        };
    }, []);

    const mapCenter = useMemo<[number, number]>(() => {
        if (lastPosUi) return [lastPosUi.coords.latitude, lastPosUi.coords.longitude];
        return DEFAULT_CENTER;
    }, [lastPosUi]);
    const mapZoom = lastPosUi ? 16 : 5;
    const displayPath = useMemo(() => {
        if (pathPoints.length < 2) return pathPoints;
        const smoothed = smoothPath(pathPoints, 5);
        return simplifyRdp(smoothed, 8);
    }, [pathPoints]);

    const distanceKm = routeDistanceM > 0 ? (routeDistanceM / 1000).toFixed(2) : "0.00";
    const durationLabel = sessionStartIso
        ? formatDurationMs(nowTick - new Date(sessionStartIso).getTime())
        : "-";
    const batteryLabel = null;
    const networkLabel = networkInfo
        ? `${networkInfo.effectiveType ?? "net"}${networkInfo.downlink ? ` • ${networkInfo.downlink.toFixed(1)}Mbps` : ""}`
        : null;

    const metrics: Metric[] = [
        { label: "Session", value: sessionId ?? "-" },
        { label: "Queue", value: `${queueSizeUi} pts` },
        { label: "Watcher", value: watching ? "ON" : "OFF" },
        { label: "Last sent", value: lastSentAt ? formatDate(lastSentAt) : "-" },
        { label: "Token", value: token ? "OK" : "-" },
        { label: "Token type", value: token ? tokenType ?? "Bearer" : "-" },
    ];

    return (
        <div className="dashboard">
            <MapCard
                center={mapCenter}
                zoom={mapZoom}
                path={displayPath}
                marker={
                    lastPosUi
                        ? {
                            lat: lastPosUi.coords.latitude,
                            lon: lastPosUi.coords.longitude,
                            accuracyM: lastPosUi.coords.accuracy ?? null,
                        }
                        : null
                }
                coordsLabel={formatCoords(lastPosUi)}
                statusLabel={`${tracking ? "Tracking active" : "Tracking stopped"} • ${distanceKm} km`}
                title="Live Map"
            />

            <SessionControlPanel
                tracking={tracking}
                toggleBusy={toggleBusy}
                metrics={metrics}
                onToggle={(next) => (next ? startTracking() : stopTracking())}
                onResume={() => startTracking()}
                showResume={tracking && !watching}
                error={err}
            />

            <LogsCard logs={log} />

            <StatsDock
                distanceKm={distanceKm}
                durationLabel={durationLabel}
                pointsCount={pathPoints.length}
                batteryLabel={batteryLabel}
                networkLabel={networkLabel}
                lastSentLabel={lastSentAt ? formatDate(lastSentAt) : "-"}
            />
        </div>
    );
}
