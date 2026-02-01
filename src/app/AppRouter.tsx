import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { AuthProvider, useAuth } from '@/features/auth/model/AuthContext';
import { AuthPage } from '@/features/auth/ui/AuthPage';
import { DashboardPage } from '@/features/tracking/ui/DashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LogoutPage } from '@/pages/LogoutPage';

function RequireAuth() {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function RedirectIfAuth() {
    const { token } = useAuth();
    if (token) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

function AppLayout() {
    const { token } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <AppHeader isAuthed={!!token} onLogout={() => navigate('/logout')} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route
                            index
                            element={<Navigate to={localStorage.getItem('tracker_web_token') ? '/dashboard' : '/login'} replace />}
                        />
                        <Route element={<RedirectIfAuth />}>
                            <Route path="/login" element={<AuthPage mode="login" />} />
                            <Route path="/register" element={<AuthPage mode="register" />} />
                        </Route>
                        <Route element={<RequireAuth />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/logout" element={<LogoutPage />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
