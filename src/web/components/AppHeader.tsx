import { NavLink } from "react-router-dom";

export function AppHeader({
    isAuthed,
    onLogout,
}: {
    isAuthed: boolean;
    onLogout: () => void;
}) {
    return (
        <header className="app-header">
            <div className="brand">
                <div className="brand-mark">T</div>
                <div>
                    <div className="brand-title">Tracker Mobile</div>
                    <div className="brand-subtitle">Live field tracking console</div>
                </div>
            </div>
            {isAuthed ? (
                <nav className="nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/history"
                        className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
                    >
                        History
                    </NavLink>
                    <button className="nav-link" onClick={onLogout}>
                        Logout
                    </button>
                </nav>
            ) : null}
        </header>
    );
}
