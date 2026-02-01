import { Link } from 'react-router-dom';
import { MapPin, Home, History, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useState } from 'react';

interface AppHeaderProps {
    isAuthed: boolean;
    onLogout: () => void;
}

export function AppHeader({ isAuthed, onLogout }: AppHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-900">Tracker</h1>
                            <p className="text-xs text-gray-500">Live GPS Tracking</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    {isAuthed && (
                        <nav className="hidden md:flex items-center gap-2">
                            <Link to="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to="/history">
                                <Button variant="ghost" size="sm">
                                    <History className="w-4 h-4 mr-2" />
                                    History
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={onLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </nav>
                    )}

                    {/* Mobile Menu Button */}
                    {isAuthed && (
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    )}
                </div>

                {/* Mobile Navigation */}
                {isAuthed && mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
                        <nav className="flex flex-col gap-2">
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <History className="w-4 h-4 mr-2" />
                                    History
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    onLogout();
                                }}
                                className="w-full justify-start"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
