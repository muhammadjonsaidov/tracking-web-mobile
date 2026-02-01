import { useEffect, useState } from "react";

export function useBatteryInfo() {
    const [level, setLevel] = useState<number | null>(null);
    const [charging, setCharging] = useState<boolean | null>(null);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        const nav = navigator as any;
        if (!nav.getBattery) {
            setSupported(false);
            return;
        }
        let battery: any;
        let update: (() => void) | null = null;
        let mounted = true;

        nav.getBattery().then((b: any) => {
            if (!mounted) return;
            battery = b;
            update = () => {
                const lvl = typeof battery.level === "number" ? battery.level : null;
                const chg = typeof battery.charging === "boolean" ? battery.charging : null;
                setLevel(lvl);
                setCharging(chg);

                const chargingTime = battery.chargingTime;
                const dischargingTime = battery.dischargingTime;
                const looksStub =
                    lvl === 1 &&
                    chg === true &&
                    chargingTime === Infinity &&
                    dischargingTime === Infinity;
                setSupported(!looksStub && lvl != null);
            };
            update();
            battery.addEventListener("levelchange", update);
            battery.addEventListener("chargingchange", update);
            battery.addEventListener("chargingtimechange", update);
            battery.addEventListener("dischargingtimechange", update);
        });

        return () => {
            mounted = false;
            if (battery && update) {
                battery.removeEventListener("levelchange", update);
                battery.removeEventListener("chargingchange", update);
                battery.removeEventListener("chargingtimechange", update);
                battery.removeEventListener("dischargingtimechange", update);
            }
        };
    }, []);

    return { level, charging, supported };
}
