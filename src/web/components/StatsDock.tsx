type DockItem = { label: string; value: string };

export function StatsDock({
    distanceKm,
    durationLabel,
    pointsCount,
    batteryLabel,
    networkLabel,
    lastSentLabel,
}: {
    distanceKm: string;
    durationLabel: string;
    pointsCount: number;
    batteryLabel: string | null;
    networkLabel: string | null;
    lastSentLabel: string;
}) {
    const items: DockItem[] = [
        { label: "Distance", value: `${distanceKm} km` },
        { label: "Duration", value: durationLabel },
        { label: "Points", value: String(pointsCount) },
        ...(batteryLabel ? [{ label: "Battery", value: batteryLabel }] : []),
        ...(networkLabel ? [{ label: "Network", value: networkLabel }] : []),
        { label: "Last sent", value: lastSentLabel },
    ];

    return (
        <div className="card dock">
            <div className="dock-grid">
                {items.map((item) => (
                    <div className="dock-item" key={item.label}>
                        <div className="dock-label">{item.label}</div>
                        <div className="dock-value">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
