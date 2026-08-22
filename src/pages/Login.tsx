import "../landing.css";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="login-page">
      <svg className="hero-mountains" viewBox="0 0 1440 420" preserveAspectRatio="none" style={{ height: "40vh", minHeight: 240, position: "absolute", bottom: 0, left: 0, width: "100%" }}>
        <path d="M0 420 L0 300 L180 180 L300 260 L460 120 L620 280 L760 200 L920 320 L1080 160 L1240 300 L1440 220 L1440 420 Z" fill="#16281f" opacity=".55" />
        <path d="M0 420 L0 340 L140 250 L320 340 L500 210 L680 350 L860 260 L1040 360 L1220 250 L1440 340 L1440 420 Z" fill="#101a15" opacity=".85" />
        <path d="M0 420 L0 380 L220 320 L420 390 L640 300 L880 400 L1120 330 L1440 390 L1440 420 Z" fill="#0b1210" />
      </svg>
      <div className="login-card">
        <img src="/assets/logo-club.png" alt="Campamento Shadday" />
        <div className="section-tag" style={{ justifyContent: "center", marginBottom: ".5rem" }}>Firme en Sus Pisadas</div>
        <h1>Bienvenido, Conquistador</h1>
        <p className="sub">
          Este campamento es un espacio privado del club. Inicia sesión o crea tu cuenta
          para entrar, ver la información del evento, registrarte y participar.
        </p>
        <div className="login-actions">
          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => { window.location.href = getOAuthUrl(); }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
            Iniciar Sesión
          </button>
          <button
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "center", padding: "1.05rem 2rem" }}
            onClick={() => { window.location.href = getOAuthUrl(); }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M18 8v6M15 11h6" /></svg>
            Crear Cuenta Nueva
          </button>
        </div>
        <div className="login-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.01" /></svg>
          <span>Ambas opciones usan el acceso seguro de la plataforma: si ya tienes cuenta entrarás directo, y si eres nuevo se creará automáticamente al continuar. <b>El campamento es un espacio privado del club:</b> solo los conquistadores registrados pueden ver la información.</span>
        </div>
      </div>
    </div>
  );
}
