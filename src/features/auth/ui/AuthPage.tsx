import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardContent } from '@/shared/ui';
import { api, getBaseUrl, setBaseUrl, unwrap } from '@/shared/api/client';
import { useAuth } from '../model/AuthContext';
import type { AuthResponse } from '@/shared/types';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const [usernameOrEmail, setU] = useState('');
    const [password, setP] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [baseUrl, setBaseUrlState] = useState(() => getBaseUrl());
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    function applyBaseUrl() {
        const value = baseUrl.trim();
        if (!value) {
            setErr('Base URL is empty.');
            return;
        }
        setBaseUrl(value);
        setBaseUrlState(getBaseUrl());
        setInfo(`Base URL set: ${getBaseUrl()}`);
    }

    async function doRegister(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setInfo(null);
        setIsLoading(true);
        try {
            await unwrap<any>(
                api.post('/api/v1/auth/register', {
                    username: regUsername,
                    email: regEmail,
                    password: regPassword,
                })
            );
            setInfo('Registered successfully! Please login.');
            setTimeout(() => navigate('/login'), 1500);
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? 'Registration failed';
            setErr(m);
        } finally {
            setIsLoading(false);
        }
    }

    async function doLogin(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setInfo(null);
        setIsLoading(true);
        try {
            const data = await unwrap<AuthResponse>(
                api.post('/api/v1/auth/login', { usernameOrEmail, password })
            );
            setAuth(data.accessToken, data.tokenType);
            navigate('/dashboard');
        } catch (ex: any) {
            const m = ex?.response?.data?.message ?? 'Login failed';
            setErr(m);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
                {/* Hero Section */}
                <Card variant="glass" className="bg-gradient-to-br from-primary-500 to-primary-700 text-white border-none shadow-2xl">
                    <CardContent className="flex flex-col justify-between min-h-[320px] p-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Bring Your Field Team Online</h2>
                            <p className="text-primary-50 text-lg leading-relaxed">
                                Sign in to start a live tracking session, capture movement in real-time, and review your recent sessions.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary-100 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <Lock className="w-4 h-4" />
                            <span>Secure HTTPS required for geolocation</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Auth Form */}
                <Card className="shadow-2xl">
                    <CardHeader>
                        <div className="flex gap-2 mb-6">
                            <Button
                                variant={mode === 'login' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => navigate('/login')}
                                className="flex-1"
                            >
                                Login
                            </Button>
                            <Button
                                variant={mode === 'register' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => navigate('/register')}
                                className="flex-1"
                            >
                                Register
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Base URL Configuration */}
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Backend base URL"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrlState(e.target.value)}
                                    />
                                </div>
                                <Button variant="secondary" onClick={applyBaseUrl} className="shrink-0">
                                    <Server className="w-4 h-4 mr-2" />
                                    Connect
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Example: https://xxxx.ngrok-free.app</p>
                        </div>

                        {/* Login Form */}
                        {mode === 'login' && (
                            <form onSubmit={doLogin} className="space-y-4">
                                <Input
                                    label="Username or Email"
                                    placeholder="Enter your username or email"
                                    value={usernameOrEmail}
                                    onChange={(e) => setU(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setP(e.target.value)}
                                    required
                                />
                                <Button type="submit" className="w-full" isLoading={isLoading}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Login
                                </Button>
                            </form>
                        )}

                        {/* Register Form */}
                        {mode === 'register' && (
                            <form onSubmit={doRegister} className="space-y-4">
                                <Input
                                    label="Username"
                                    placeholder="Choose a username"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    required
                                />
                                <Button type="submit" className="w-full" isLoading={isLoading}>
                                    <User className="w-4 h-4 mr-2" />
                                    Create Account
                                </Button>
                            </form>
                        )}

                        {/* Messages */}
                        {err && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-slide-up">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{err}</span>
                            </div>
                        )}
                        {info && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-slide-up">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{info}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
