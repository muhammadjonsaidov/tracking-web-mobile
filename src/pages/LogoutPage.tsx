import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { api, unwrap } from '@/shared/api/client';
import { useAuth } from '@/features/auth/model/AuthContext';
import { nowIsoUtc } from '@/shared/utils/id';

const SESSION_KEY = 'tracker_web_session_id';
const SESSION_START_KEY = 'tracker_web_session_start';

export function LogoutPage() {
    const { token, clearAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        async function stopSessionIfAny() {
            const sid = localStorage.getItem(SESSION_KEY);
            if (token && sid) {
                try {
                    await unwrap<any>(
                        api.post(`/api/v1/tracking/sessions/${sid}/stop`, {
                            stopTime: nowIsoUtc(),
                            stopLat: null,
                            stopLon: null,
                        })
                    );
                } catch {
                    // ignore stop failure on logout
                }
            }
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_START_KEY);
            if (mounted) clearAuth();
        }
        stopSessionIfAny().catch(() => {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_START_KEY);
            if (mounted) clearAuth();
        });
        return () => {
            mounted = false;
        };
    }, [token, clearAuth]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
            <Card className="max-w-md w-full shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Logged Out Successfully</CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        You have been logged out. Any active tracking session has been stopped.
                    </p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Back to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
