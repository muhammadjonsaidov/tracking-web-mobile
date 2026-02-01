import { MapPin, Activity } from 'lucide-react';
import { Card } from '@/shared/ui';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapCardProps {
    center: [number, number];
    zoom: number;
    path: [number, number][];
    marker: { lat: number; lon: number; accuracyM: number | null } | null;
    coordsLabel: string;
    statusLabel: string;
    title: string;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export function MapCard({ center, zoom, path, marker, coordsLabel, statusLabel, title }: MapCardProps) {
    return (
        <Card className="overflow-hidden col-span-full lg:col-span-7 animate-fade-in">
            <div className="relative h-[400px] lg:h-[500px] w-full">
                <MapContainer
                    center={center}
                    zoom={zoom}
                    className="h-full w-full"
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={center} zoom={zoom} />

                    {path.length > 1 && (
                        <Polyline
                            positions={path as LatLngExpression[]}
                            pathOptions={{
                                color: '#0ea5e9',
                                weight: 4,
                                opacity: 0.8,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    )}

                    {marker && (
                        <>
                            <Marker position={[marker.lat, marker.lon] as LatLngExpression} />
                            {marker.accuracyM && (
                                <Circle
                                    center={[marker.lat, marker.lon] as LatLngExpression}
                                    radius={marker.accuracyM}
                                    pathOptions={{
                                        color: '#0ea5e9',
                                        fillColor: '#0ea5e9',
                                        fillOpacity: 0.1,
                                        weight: 1,
                                    }}
                                />
                            )}
                        </>
                    )}
                </MapContainer>

                {/* Overlay Info */}
                <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
                    <div className="glass-card rounded-xl p-4 shadow-2xl max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <h3 className="font-bold text-gray-900">{title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">{coordsLabel}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{statusLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
