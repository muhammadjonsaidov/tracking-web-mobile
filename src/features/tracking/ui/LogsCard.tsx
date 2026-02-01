import { Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';

interface LogsCardProps {
    logs: string[];
}

export function LogsCard({ logs }: LogsCardProps) {
    return (
        <Card className="col-span-full lg:col-span-5 bg-gray-900 text-gray-100 border-gray-800 animate-slide-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                    <Terminal className="w-5 h-5 text-green-400" />
                    Activity Log
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
                    {logs.length === 0 ? (
                        <div className="text-gray-500 italic">No activity yet...</div>
                    ) : (
                        logs.map((line, i) => (
                            <div key={i} className="text-green-400 hover:bg-green-900/20 px-2 py-0.5 rounded">
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
