import type { Metric } from "../types";
import { SwipeToggle } from "./SwipeToggle";

export function SessionControlPanel({
    tracking,
    toggleBusy,
    metrics,
    onToggle,
    onResume,
    showResume,
    error,
}: {
    tracking: boolean;
    toggleBusy: boolean;
    metrics: Metric[];
    onToggle: (next: boolean) => void;
    onResume: () => void;
    showResume: boolean;
    error?: string | null;
}) {
    return (
        <div className="card session-panel">
            <div className="card-title">Session control</div>
            <div className="toggle-card">
                <SwipeToggle value={tracking} disabled={toggleBusy} onChange={onToggle} />
                <div className="hint">Swipe to turn {tracking ? "OFF" : "ON"}</div>
                <div className="stat-row">
                    {metrics.map((m) => (
                        <div key={m.label} className="stat">
                            <div>{m.label}</div>
                            <strong className={m.label === "Session" ? "mono" : undefined}>{m.value}</strong>
                        </div>
                    ))}
                </div>
                {showResume ? (
                    <button className="button secondary" onClick={onResume}>
                        Resume tracking
                    </button>
                ) : null}
                {error && <div className="error">{error}</div>}
            </div>
        </div>
    );
}
