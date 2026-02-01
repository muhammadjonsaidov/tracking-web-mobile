export function formatCoords(pos: GeolocationPosition | null) {
    if (!pos) return "No location yet";
    const { latitude, longitude, accuracy } = pos.coords;
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
}

export function approxDistanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function smoothPath(points: [number, number][], windowSize: number) {
    if (points.length <= 2 || windowSize <= 1) return points;
    const half = Math.floor(windowSize / 2);
    return points.map((_, idx) => {
        let sumLat = 0;
        let sumLon = 0;
        let count = 0;
        for (let i = idx - half; i <= idx + half; i += 1) {
            if (i < 0 || i >= points.length) continue;
            sumLat += points[i][0];
            sumLon += points[i][1];
            count += 1;
        }
        return [sumLat / count, sumLon / count] as [number, number];
    });
}

export function simplifyRdp(points: [number, number][], epsilonM: number): [number, number][] {
    if (points.length <= 2) return points;
    const first = points[0];
    const last = points[points.length - 1];
    let index = 0;
    let maxDist = 0;
    for (let i = 1; i < points.length - 1; i += 1) {
        const d = perpendicularDistanceM(points[i], first, last);
        if (d > maxDist) {
            index = i;
            maxDist = d;
        }
    }
    if (maxDist > epsilonM) {
        const left = simplifyRdp(points.slice(0, index + 1), epsilonM);
        const right = simplifyRdp(points.slice(index), epsilonM);
        return [...left.slice(0, -1), ...right];
    }
    return [first, last];
}

export function getPathBounds(
    points: [number, number][]
): [[number, number], [number, number]] | null {
    if (points.length === 0) return null;
    let minLat = points[0][0];
    let maxLat = points[0][0];
    let minLon = points[0][1];
    let maxLon = points[0][1];
    for (const [lat, lon] of points) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
    }
    return [
        [minLat, minLon],
        [maxLat, maxLon],
    ];
}

export function getPathCenter(points: [number, number][]): [number, number] | null {
    const bounds = getPathBounds(points);
    if (!bounds) return null;
    return [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
    ];
}

function perpendicularDistanceM(
    p: [number, number],
    a: [number, number],
    b: [number, number]
) {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const lat0 = toRad((a[0] + b[0]) / 2);
    const ax = toRad(a[1]) * Math.cos(lat0) * R;
    const ay = toRad(a[0]) * R;
    const bx = toRad(b[1]) * Math.cos(lat0) * R;
    const by = toRad(b[0]) * R;
    const px = toRad(p[1]) * Math.cos(lat0) * R;
    const py = toRad(p[0]) * R;

    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));
    const projX = ax + clamped * dx;
    const projY = ay + clamped * dy;
    return Math.hypot(px - projX, py - projY);
}
