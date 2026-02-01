import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, unwrap } from "../api";
import { LogoutView } from "../components/LogoutView";
import { useAuth } from "../context/AuthContext";
import { nowIsoUtc } from "../utils/id";

const SESSION_KEY = "tracker_web_session_id";
const SESSION_START_KEY = "tracker_web_session_start";

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

    return <LogoutView onBack={() => navigate("/login")} />;
}
