import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { rankTitle } from "@/components/ProfileCard";

export default function Explorar() {
  const dirQ = trpc.camp.directory.useQuery();
  const activityQ = trpc.camp.recentActivity.useQuery();
  const [q, setQ] = useState("");
  const activity = activityQ.data ?? [];

  const list = (dirQ.data ?? []).filter((m) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      m.fullName.toLowerCase().includes(t) ||
      m.profileCode.toLowerCase().includes(t) ||
      (m.groupName ?? "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="profile-page">
      <div className="hs-container" style={{ maxWidth: 1000 }}>
        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>

        <div style={{ textAlign: "center", margin: "30px 0 26px" }}>
          <img
            src="/assets/logo-club.png"
            alt="Campamento Shadday"
            style={{ width: 84, height: 84, borderRadius: "50%" }}
          />
          <h1
            style={{
              fontFamily: "Oswald, sans-serif",
              fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
              letterSpacing: ".06em",
              marginTop: 10,
            }}
          >
            EXPLORAR CONQUISTADORES
          </h1>
          <p style={{ color: "var(--muted)", fontSize: ".92rem", marginTop: 6 }}>
            Navega entre los perfiles del campamento, mira sus logros, deja un
            me gusta en sus fotos o escríbeles un comentario.
          </p>
        </div>

        <div className="comment-form" style={{ maxWidth: 420, margin: "0 auto 26px" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, grupo o código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* ACTIVIDAD RECIENTE DEL CLUB */}
        {activity.length > 0 && !q && (
          <div style={{ marginBottom: 34 }}>
            <div className="section-tag">Actividad del Club</div>
            <h2 style={{ fontSize: "1.35rem", marginBottom: 16 }}>Últimas publicaciones</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {activity.map((p) => (
                <div className="activity-card" key={p.id}>
                  <div className="comment-avatar">
                    {p.authorAvatar ? <img src={p.authorAvatar} alt="" /> : p.authorName.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-body">
                    <div className="activity-head">
                      <Link to={`/perfil/${p.authorCode}`}>{p.authorName}</Link>
                      {" · "}
                      {new Date(p.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </div>
                    <p className="ab-text">{p.body}</p>
                    {p.photo && <img src={p.photo} alt="" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-tag">Conquistadores</div>
        <h2 style={{ fontSize: "1.35rem", marginBottom: 16 }}>Todos los perfiles</h2>

        {dirQ.isLoading && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
            Cargando conquistadores…
          </p>
        )}

        {!dirQ.isLoading && list.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
            {q
              ? "No se encontraron conquistadores con esa búsqueda."
              : "Aún no hay conquistadores registrados. ¡Sé el primero!"}
          </p>
        )}

        <div className="explore-grid">
          {list.map((m, i) => (
            <Link key={m.profileCode} to={`/perfil/${m.profileCode}`} className="explore-card">
              <div className="explore-ava">
                {m.avatar ? (
                  <img src={m.avatar} alt={m.fullName} />
                ) : (
                  m.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <h4>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}
                {m.fullName}
              </h4>
              <div className="ec-group">{m.groupName ?? "Sin grupo"}</div>
              <div className="ec-pts">⭐ {m.points} pts · #{i + 1}</div>
              <div className="ec-rank">{rankTitle(m.points)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
