import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to sign in with Google.");
      setBusy(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="panel admin-panel">
        <span className="eyebrow">Admin</span>

        <h1>Admin login</h1>

        <p>Sign in with your approved Google account to manage links and programs.</p>

        <button className="generate" onClick={login} disabled={busy}>
          {busy ? "Signing in..." : "Continue with Google"}
        </button>

        {error && <div className="status">{error}</div>}
      </section>
    </main>
  );
}
