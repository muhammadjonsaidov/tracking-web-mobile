export function LogoutView({ onBack }: { onBack: () => void }) {
    return (
        <div className="logout-layout">
            <div className="card logout-card">
                <div className="card-title">Signed out</div>
                <p className="hint">
                    You are logged out. Your device will stop sending locations until you sign in again.
                </p>
                <div className="grid">
                    <button className="button" onClick={onBack}>
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}
