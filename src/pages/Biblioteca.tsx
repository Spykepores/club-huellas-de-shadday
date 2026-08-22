import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import "../landing.css";

const CATS = ["Todas", "Libros", "Especialidades", "Cartillas", "Materiales"] as const;

const CAT_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  Libros: { icon: "📚", color: "#e2a63d", bg: "rgba(226,166,61,.12)" },
  Especialidades: { icon: "🎖️", color: "#8fc19b", bg: "rgba(95,138,107,.14)" },
  Cartillas: { icon: "📄", color: "#f0954d", bg: "rgba(240,149,77,.12)" },
  Materiales: { icon: "🎒", color: "#b8c0c8", bg: "rgba(184,192,200,.1)" },
};

export default function Biblioteca() {
  const resourcesQ = trpc.camp.resources.useQuery();
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todas");
  const [q, setQ] = useState("");

  const all = resourcesQ.data ?? [];
  const list = all.filter((r) => {
    if (cat !== "Todas" && r.category !== cat) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return r.title.toLowerCase().includes(t) || (r.description ?? "").toLowerCase().includes(t);
  });

  const counts = all.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page">
      <nav className="page-nav">
        <div className="hs-container">
          <Link to="/" className="brand">
            <img src="/assets/logo-club.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--orange)", objectFit: "cover" }} />
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>
              Campamento Shadday
              <small style={{ display: "block", fontSize: ".62rem", color: "var(--orange2)", letterSpacing: ".22em", textTransform: "uppercase" }}>Biblioteca del Club</small>
            </span>
          </Link>
          <Link to="/" className="btn-ghost" style={{ padding: ".55rem 1.3rem", fontSize: ".85rem" }}>← Volver</Link>
        </div>
      </nav>

      <div className="hs-container page-body" style={{ maxWidth: 980 }}>
        {/* HERO DE LA BIBLIOTECA */}
        <div className="lib-hero">
          <div className="lib-hero-glow" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="section-tag" style={{ justifyContent: "center" }}>Banco de Información</div>
            <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", letterSpacing: ".04em" }}>
              BIBLIOTECA DEL CLUB
            </h1>
            <p style={{ color: "var(--muted)", maxWidth: 520, margin: ".6rem auto 0", fontSize: ".95rem", lineHeight: 1.6 }}>
              Libros, guías de especialidades, cartillas y materiales para todos los clubes.
              Todo el conocimiento del conquistador, en un solo lugar.
            </p>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="comment-form" style={{ maxWidth: 440, margin: "0 auto 1.4rem" }}>
          <input
            type="text"
            placeholder="🔍 Buscar un libro, especialidad, cartilla…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* CATEGORÍAS */}
        <div className="lib-pills">
          {CATS.map((c) => (
            <button
              key={c}
              className={`lib-pill ${cat === c ? "active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c !== "Todas" && <span>{CAT_STYLE[c]?.icon}</span>} {c}
              {c !== "Todas" && counts[c] ? <em>{counts[c]}</em> : null}
            </button>
          ))}
        </div>

        {resourcesQ.isLoading && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "3rem 0" }}>Abriendo la biblioteca…</p>
        )}

        {!resourcesQ.isLoading && list.length === 0 && (
          <div className="podio-empty" style={{ margin: "2rem auto" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" /></svg>
            <p>
              {all.length === 0
                ? "La biblioteca se está estrenando. La directiva publicará aquí libros, especialidades, cartillas y materiales muy pronto."
                : "No encontramos recursos con esa búsqueda."}
            </p>
          </div>
        )}

        {/* GRID DE RECURSOS */}
        <div className="lib-grid">
          {list.map((r) => {
            const st = CAT_STYLE[r.category] ?? CAT_STYLE.Materiales;
            const isFile = /^\/api\/resource-file\/\d+$/.test(r.url);
            return (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="lib-card">
                <div className="lib-icon" style={{ background: st.bg, border: `1px solid ${st.color}44` }}>
                  <span>{st.icon}</span>
                </div>
                <div className="lib-info">
                  <span className="lib-cat" style={{ color: st.color }}>{r.category}</span>
                  <h3>{r.title}</h3>
                  {r.description && <p>{r.description}</p>}
                  <span className="lib-open" style={{ color: st.color }}>
                    {isFile ? "Ver / Descargar archivo" : "Abrir recurso"}
                    {isFile ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M7 17L17 7M9 7h8v8" /></svg>
                    )}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
