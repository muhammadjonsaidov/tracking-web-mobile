export type AuthResponse = { accessToken: string; tokenType: string };
export type StartSessionResponse = { sessionId: string; startTime: string; status: string };
export type IngestResponse = { accepted: number; inserted: number };

export type SessionRow = {
    sessionId: string;
    startTime?: string | null;
    stopTime?: string | null;
    status?: string | null;
    lastPointAt?: string | null;
};

export type PointRow = {
    ts?: string | null;
    lat: number;
    lon: number;
    accuracyM?: number | null;
    speedMps?: number | null;
    headingDeg?: number | null;
};

export type PointsResponse = {
    points: PointRow[];
    truncated?: boolean;
    total?: number;
};

export type ProviderType = '' | 'gps' | 'network' | 'fused';

export type QueuedPoint = {
    eventId: string;
    lat: number;
    lon: number;
    deviceTimestamp: string;
    accuracyM?: number | null;
    speedMps?: number | null;
    headingDeg?: number | null;
    provider?: string | null;
    mock?: boolean | null;
};

export type AvgBucket = {
    count: number;
    sumLat: number;
    sumLon: number;
    sumAcc: number;
    accCount: number;
    sumSpeed: number;
    speedCount: number;
    sumHeading: number;
    headingCount: number;
    firstTsMs: number;
    lastTsMs: number;
};

export type Metric = {
    label: string;
    value: string;
};

export type NetworkInfo = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
};
