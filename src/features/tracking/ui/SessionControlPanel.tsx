import { Play, Square, RefreshCw, AlertCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import type { Metric } from '@/shared/types';

interface SessionControlPanelProps {
    tracking: boolean;
    toggleBusy: boolean;
    metrics: Metric[];
    onToggle: (next: boolean) => void;
    onResume: () => void;
    showResume: boolean;
    error?: string | null;
}

export function SessionControlPanel({
    tracking,
    toggleBusy,
    metrics,
    onToggle,
    onResume,
    showResume,
    error,
}: SessionControlPanelProps) {
    return (
        <Card className="col-span-full lg:col-span-5 animate-slide-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    Session Control
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Toggle Button */}
                <div className="flex flex-col gap-3">
                    <Button
                        variant={tracking ? 'danger' : 'primary'}
                        size="lg"
                        onClick={() => onToggle(!tracking)}
                        isLoading={toggleBusy}
                        className="w-full text-lg py-4"
                    >
                        {tracking ? (
                            <>
                                <Square className="w-5 h-5 mr-2" />
                                Stop Tracking
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 mr-2" />
                                Start Tracking
                            </>
                        )}
                    </Button>

                    {showResume && (
                        <Button
                            variant="secondary"
                            onClick={onResume}
                            className="w-full"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Resume Watchers
                        </Button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                        >
                            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                            <div className="text-sm font-semibold text-gray-900 truncate" title={m.value}>
                                {m.value}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
