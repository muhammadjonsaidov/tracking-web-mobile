import { Route, Clock, Wifi, Send } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';

interface StatsDockProps {
    distanceKm: string;
    durationLabel: string;
    pointsCount: number;
    batteryLabel: string | null;
    networkLabel: string | null;
    lastSentLabel: string;
}

export function StatsDock({
    distanceKm,
    durationLabel,
    pointsCount,
    networkLabel,
    lastSentLabel,
}: StatsDockProps) {
    const stats = [
        { icon: Route, label: 'Distance', value: `${distanceKm} km`, color: 'text-blue-600' },
        { icon: Clock, label: 'Duration', value: durationLabel, color: 'text-purple-600' },
        { icon: Route, label: 'Points', value: pointsCount.toString(), color: 'text-green-600' },
        { icon: Wifi, label: 'Network', value: networkLabel || 'Unknown', color: 'text-orange-600' },
        { icon: Send, label: 'Last Sent', value: lastSentLabel, color: 'text-pink-600' },
    ];

    return (
        <Card variant="glass" className="col-span-full sticky bottom-4 shadow-2xl animate-slide-up">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/80 ${stat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600">{stat.label}</div>
                                    <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
