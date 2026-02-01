import type { SessionRow } from "../types";
import { formatDate, formatDurationMs } from "../utils/time";
import { MapCard } from "./MapCard";

export function HistoryView({
    history,
    loading,
    onRefresh,
    error,
    expandedId,
    detailsById,
    detailLoading,
    detailError,
    onToggle,
    onReload,
}: {
    history: SessionRow[];
    loading: boolean;
    onRefresh: () => void;
    error?: string | null;
    expandedId: string | null;
    detailsById: Record<
        string,
        {
            points: { lat: number; lon: number; accuracyM?: number | null }[];
            path: [number, number][];
            center: [number, number];
            bounds?: [[number, number], [number, number]] | null;
            marker?: { lat: number; lon: number; accuracyM?: number | null } | null;
            distanceM: number;
            durationMs: number | null;
            truncated?: boolean;
            total?: number;
            lastTs?: string | null;
        }
    >;
    detailLoading: Record<string, boolean>;
    detailError: Record<string, string | null>;
    onToggle: (session: SessionRow) => void;
    onReload: (session: SessionRow) => void;
}) {
    return (
        <div className="card">
            <div className="history-header">
                <div className="card-title">My sessions ({history.length})</div>
                <button className="button secondary" onClick={onRefresh}>
                    Refresh
                </button>
            </div>
            {loading ? (
                <div className="hint">Loading...</div>
            ) : history.length === 0 ? (
                <div className="hint">No sessions yet.</div>
            ) : (
                <div className="history-list">
                    {history.map((s) => {
                        const isOpen = expandedId === s.sessionId;
                        const details = detailsById[s.sessionId];
                        const isLoading = detailLoading[s.sessionId];
                        const detailErr = detailError[s.sessionId];
                        const distanceKm =
                            details && details.distanceM > 0
                                ? (details.distanceM / 1000).toFixed(2)
                                : "0.00";
                        const durationLabel = details?.durationMs != null ? formatDurationMs(details.durationMs) : "-";
                        const coordsLabel = details?.marker
                            ? `${details.marker.lat.toFixed(5)}, ${details.marker.lon.toFixed(5)}`
                            : "No points yet";
                        const statusLabel = details
                            ? `${details.points.length} pts • ${distanceKm} km`
                            : "Route not loaded";

                        return (
                            <div className="history-item" key={s.sessionId}>
                                <div className="history-row">
                                    <div className="history-label">Session</div>
                                    <div className="mono">{s.sessionId}</div>
                                </div>
                                <div className="history-row">
                                    <div className="history-label">Status</div>
                                    <div>{s.status ?? "-"}</div>
                                </div>
                                <div className="history-row">
                                    <div className="history-label">Start</div>
                                    <div>{formatDate(s.startTime)}</div>
                                </div>
                                <div className="history-row">
                                    <div className="history-label">Stop</div>
                                    <div>{formatDate(s.stopTime)}</div>
                                </div>
                                <div className="history-row">
                                    <div className="history-label">Last point</div>
                                    <div>{formatDate(s.lastPointAt)}</div>
                                </div>
                                <div className="history-actions">
                                    <button className="button ghost small" onClick={() => onToggle(s)}>
                                        {isOpen ? "Hide route" : "View route"}
                                    </button>
                                    {isOpen ? (
                                        <button className="button secondary small" onClick={() => onReload(s)}>
                                            Reload
                                        </button>
                                    ) : null}
                                </div>
                                {isOpen ? (
                                    <div className="history-details">
                                        {isLoading ? (
                                            <div className="hint">Loading route...</div>
                                        ) : detailErr ? (
                                            <div className="error">{detailErr}</div>
                                        ) : details ? (
                                            <>
                                                {details.points.length > 0 ? (
                                                    <MapCard
                                                        center={details.center}
                                                        zoom={13}
                                                        path={details.path}
                                                        marker={details.marker}
                                                        coordsLabel={coordsLabel}
                                                        statusLabel={statusLabel}
                                                        title="Session Route"
                                                        size="compact"
                                                        fitBounds={details.path.length > 1}
                                                        bounds={details.bounds}
                                                    />
                                                ) : (
                                                    <div className="hint">No points for this session.</div>
                                                )}
                                                <div className="history-stats">
                                                    <div className="stat">
                                                        <div className="hint">Distance</div>
                                                        <strong>{distanceKm} km</strong>
                                                    </div>
                                                    <div className="stat">
                                                        <div className="hint">Duration</div>
                                                        <strong>{durationLabel}</strong>
                                                    </div>
                                                    <div className="stat">
                                                        <div className="hint">Points</div>
                                                        <strong>{details.points.length}</strong>
                                                    </div>
                                                </div>
                                                {details.truncated ? (
                                                    <div className="hint">
                                                        Showing {details.points.length} of {details.total ?? "-"} points
                                                        (downsampled).
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : (
                                            <div className="hint">No points for this session.</div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
            {error && <div className="error">{error}</div>}
        </div>
    );
}
