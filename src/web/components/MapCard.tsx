import { useEffect } from "react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const trackerMarkerSvg = encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>" +
        "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
        "<stop offset='0%' stop-color='#0f7b6c'/>" +
        "<stop offset='100%' stop-color='#22c55e'/>" +
        "</linearGradient></defs>" +
        "<circle cx='32' cy='32' r='24' fill='url(#g)'/>" +
        "<circle cx='32' cy='32' r='10' fill='#ffffff'/>" +
        "</svg>"
);

const trackerIcon = L.icon({
    iconUrl: `data:image/svg+xml,${trackerMarkerSvg}`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
});

type MapMarker = { lat: number; lon: number; accuracyM?: number | null };

function MapFollower({
    center,
    zoom,
    bounds,
    fitBounds,
}: {
    center: [number, number];
    zoom: number;
    bounds?: [[number, number], [number, number]] | null;
    fitBounds?: boolean;
}) {
    const map = useMap();
    useEffect(() => {
        if (fitBounds && bounds) {
            map.fitBounds(bounds, { padding: [24, 24], animate: true });
            return;
        }
        map.setView(center, zoom, { animate: true });
    }, [center[0], center[1], zoom, map, bounds, fitBounds]);
    return null;
}

export function MapCard({
    center,
    zoom,
    path,
    marker,
    coordsLabel,
    statusLabel,
    title = "Live Map",
    size = "default",
    fitBounds,
    bounds,
}: {
    center: [number, number];
    zoom: number;
    path: [number, number][];
    marker?: MapMarker | null;
    coordsLabel: string;
    statusLabel: string;
    title?: string;
    size?: "default" | "compact";
    fitBounds?: boolean;
    bounds?: [[number, number], [number, number]] | null;
}) {
    return (
        <div className={`card map-shell ${size === "compact" ? "compact" : ""}`}>
            <div className="map-wrapper">
                <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} zoomControl={false}>
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapFollower center={center} zoom={zoom} bounds={bounds} fitBounds={fitBounds} />
                    {path.length > 1 ? (
                        <Polyline
                            positions={path}
                            pathOptions={{ color: "#0f7b6c", weight: 4, opacity: 0.9 }}
                        />
                    ) : null}
                    {marker ? <Marker position={[marker.lat, marker.lon]} icon={trackerIcon} /> : null}
                    {marker?.accuracyM ? (
                        <Circle
                            center={[marker.lat, marker.lon]}
                            radius={marker.accuracyM}
                            pathOptions={{ color: "#0f7b6c", fillColor: "#0f7b6c", fillOpacity: 0.12 }}
                        />
                    ) : null}
                    <ZoomControl position="bottomright" />
                </MapContainer>
                <div className="map-overlay">
                    <div className="map-overlay-title">{title}</div>
                    <div className="coords">{coordsLabel}</div>
                    <div className="hint">{statusLabel}</div>
                </div>
            </div>
        </div>
    );
}
