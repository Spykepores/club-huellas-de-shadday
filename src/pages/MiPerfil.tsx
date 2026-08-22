import { useEffect, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import ProfileCard from "@/components/ProfileCard";
import "../landing.css";

export default function MiPerfil() {
  const { user, isLoading, logout } = useAuth();
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState("");
  const utils = trpc.useUtils();

  // Sonido de bienvenida al entrar con la cuenta (una vez por sesión)
  useEffect(() => {
    if (user && !sessionStorage.getItem("hs-welcomed")) {
      sessionStorage.setItem("hs-welcomed", "1");
      const a = new Audio("/assets/sonido_bienvenida.mp3");
      a.volume = 0.7;
      a.play().catch(() => {});
    }
  }, [user]);

  const myProfile = trpc.camp.myProfile.useQuery(undefined, { enabled: !!user, retry: false });
  const linkProfile = trpc.camp.linkProfile.useMutation({
    onSuccess: () => {
      setLinkError("");
      utils.camp.myProfile.invalidate();
    },
    onError: (e) => setLinkError(e.message),
  });

  let body: React.ReactNode;

  if (isLoading) {
    body = <p style={{ textAlign: "center", color: "var(--muted)", padding: "5rem 0" }}>Cargando tu cuenta…</p>;
  } else if (!user) {
    body = (
      <div className="podio-empty" style={{ margin: "4rem auto" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
        <p><strong>Inicia sesión para ver tu perfil.</strong> Aquí se guardan tus logros, tus puntos y tu posición en el ranking del campamento.</p>
        <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => (window.location.href = LOGIN_PATH)}>
          Ingresar / Crear Cuenta
        </button>
      </div>
    );
  } else if (myProfile.isLoading) {
    body = <p style={{ textAlign: "center", color: "var(--muted)", padding: "5rem 0" }}>Buscando tu registro…</p>;
  } else if (!myProfile.data) {
    body = (
      <div className="form-card" style={{ textAlign: "center", marginTop: "2rem" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="1.5" style={{ margin: "0 auto" }}>
          <circle cx="12" cy="12" r="10" /><path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" />
        </svg>
        <h2 style={{ fontSize: "1.4rem" }}>Hola, {user.name ?? "conquistador"}</h2>
        <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>
          Tu cuenta aún no tiene una ficha de conquistador vinculada. Completa tu inscripción
          o vincula el código de perfil que recibiste si ya te registraste.
        </p>
        <Link to="/registro" className="btn-primary" style={{ justifyContent: "center" }}>Completar mi Inscripción</Link>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "1.2rem", display: "grid", gap: ".7rem" }}>
          <p style={{ fontSize: ".8rem", color: "var(--muted)", letterSpacing: ".12em", textTransform: "uppercase" }}>¿Ya te registraste sin cuenta?</p>
          <div style={{ display: "flex", gap: ".6rem" }}>
            <input
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="Código de perfil (ej: HD-7K2X)"
              maxLength={10}
              style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: ".7rem 1rem", color: "var(--text)", textTransform: "uppercase" }}
            />
            <button className="btn-primary" style={{ padding: ".7rem 1.4rem" }} disabled={linkProfile.isPending || linkCode.length < 6}
              onClick={() => linkProfile.mutate({ code: linkCode })}>
              Vincular
            </button>
          </div>
          {linkError && <div className="alert-error">{linkError}</div>}
        </div>
      </div>
    );
  } else {
    const d = myProfile.data;
    body = (
      <>
        <div className="edit-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f8a6b" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          <span><b>Personaliza tu perfil:</b> toca la 📷 del avatar para tu foto, "Cambiar foto de portada" para tu imagen de fondo, agrega tu lema, sube hasta 8 fotos y pon tu video favorito de YouTube.
          {d.group && <> Código de tu grupo: <span className="tag">{d.group.code}</span></>}</span>
        </div>
        <ProfileCard data={d} editable />
        <div style={{ textAlign: "center", marginTop: "3rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/#podio" className="btn-ghost">Ver el Podio de Grupos</Link>
          <button className="btn-ghost" onClick={logout}>Cerrar Sesión</button>
        </div>
      </>
    );
  }

  return (
    <div className="page">
      <nav className="page-nav">
        <div className="hs-container">
          <Link to="/" className="brand">
            <img src="/assets/logo-club.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--orange)", objectFit: "cover" }} />
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>Campamento Shadday<small style={{ display: "block", fontSize: ".62rem", color: "var(--orange2)", letterSpacing: ".22em", textTransform: "uppercase" }}>Firme en Sus Pisadas</small></span>
          </Link>
          <Link to="/" className="btn-ghost" style={{ padding: ".55rem 1.3rem", fontSize: ".85rem" }}>← Volver</Link>
        </div>
      </nav>
      <div className="hs-container page-body" style={{ maxWidth: 860 }}>{body}</div>
    </div>
  );
}
