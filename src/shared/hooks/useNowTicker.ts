import { useEffect, useState } from "react";

export function useNowTicker(enabled: boolean, intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!enabled) return;
        const t = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(t);
    }, [enabled, intervalMs]);

    return now;
}
