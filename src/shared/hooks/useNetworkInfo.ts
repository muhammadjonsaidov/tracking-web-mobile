import { useEffect, useState } from "react";
import type { NetworkInfo } from "../types";

export function useNetworkInfo() {
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

    useEffect(() => {
        const nav = navigator as any;
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        if (!connection) return;
        const update = () =>
            setNetworkInfo({
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
            });
        update();
        connection.addEventListener("change", update);
        return () => connection.removeEventListener("change", update);
    }, []);

    return networkInfo;
}
