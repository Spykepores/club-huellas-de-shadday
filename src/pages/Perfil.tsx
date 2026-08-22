import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import ProfileCard from "@/components/ProfileCard";
import ShareButtons from "@/components/ShareButtons";
import "../landing.css";

export default function Perfil() {
  const { code } = useParams<{ code: string }>();
  const profile = trpc.camp.profile.useQuery({ code: code ?? "" }, { retry: false });
  const { user } = useAuth();
  const myProfile = trpc.camp.myProfile.useQuery(undefined, { enabled: !!user, retry: false });
  const isOwner = !!myProfile.data && myProfile.data.member.profileCode === code?.toUpperCase();

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

      <div className="hs-container page-body" style={{ maxWidth: 860 }}>
        {profile.isLoading && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "4rem 0" }}>Cargando perfil…</p>
        )}

        {profile.error && (
          <div className="podio-empty" style={{ margin: "3rem auto" }}>
            <p><strong>Perfil no encontrado.</strong> Verifica el código que recibiste al registrarte (ej: HD-7K2X).</p>
            <Link to="/registro" className="btn-primary" style={{ marginTop: "1rem" }}>Ir al Registro</Link>
          </div>
        )}

        {profile.data && (
          <>
            {isOwner ? (
              <div className="owner-banner">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                <span><strong>¡Este es tu perfil!</strong> Así lo ven tus compañeros.</span>
                <Link to="/mi-perfil" className="btn-primary" style={{ marginLeft: "auto", padding: ".6rem 1.4rem", fontSize: ".88rem" }}>
                  Editar mi Perfil (foto, portada, fotos…)
                </Link>
              </div>
            ) : (
              !user && (
                <div className="edit-hint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f8a6b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.01" /></svg>
                  <span>¿Este es tu perfil? <Link to="/mi-perfil" style={{ color: "var(--orange2)", textDecoration: "underline" }}><b>Inicia sesión</b></Link> para personalizarlo con tu foto, portada, fotos y video.</span>
                </div>
              )
            )}
            <ProfileCard data={profile.data} />
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: ".2rem" }}>
                ¿Te gusta este perfil? ¡Compártelo y motiva a más conquistadores a unirse!
              </p>
              <ShareButtons
                path={`/perfil/${profile.data.member.profileCode}`}
                text={`⛺ Mira el perfil de ${profile.data.member.fullName} en el Campamento Shadday — ranking #${profile.data.rank} con ${profile.data.member.points} puntos. ¡Únete tú también!`}
              />
            </div>
            <div style={{ textAlign: "center", marginTop: "1.6rem", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/explorar" className="btn-ghost">🧭 Explorar más Perfiles</Link>
              <Link to="/#podio" className="btn-ghost">Ver el Podio de Grupos</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
