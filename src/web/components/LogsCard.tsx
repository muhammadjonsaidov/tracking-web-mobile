export function LogsCard({ logs }: { logs: string[] }) {
    return (
        <div className="card log-card">
            <div className="card-title">Live logs</div>
            <div className="log-box">
                {logs.map((x, i) => (
                    <div key={i}>{x}</div>
                ))}
            </div>
            <div className="hint">Keep the screen on and tab active for continuous tracking.</div>
        </div>
    );
}
