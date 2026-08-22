import { useMemo, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { usePlayer } from "@/providers/player";
import { toast } from "sonner";
import "../landing.css";

type View = { type: "all" } | { type: "fav" } | { type: "artist"; name: string };

export default function Musica() {
  const songsQ = trpc.camp.songs.useQuery();
  const likesQ = trpc.camp.mySongLikes.useQuery();
  const utils = trpc.useUtils();
  const player = usePlayer();
  const likeMut = trpc.camp.toggleSongLike.useMutation({
    onSuccess: (res) => {
      utils.camp.mySongLikes.invalidate();
      utils.camp.songs.invalidate();
      if (res.liked) toast.success("Guardada en tus favoritas ❤️");
      else toast.success("Quitada de tus favoritas");
    },
    onError: () => toast.error("No se pudo actualizar tu playlist."),
  });

  const songs = useMemo(() => songsQ.data ?? [], [songsQ.data]);
  const likedIds = useMemo(() => new Set(likesQ.data ?? []), [likesQ.data]);

  // Artistas agrupados (las canciones se guardan por artista)
  const artists = useMemo(() => {
    const map = new Map<string, { name: string; count: number; cover: string | null }>();
    for (const s of songs) {
      const name = (s.artist ?? "").trim() || "Campamento Shadday";
      const a = map.get(name) ?? { name, count: 0, cover: null };
      a.count += 1;
      if (!a.cover && s.cover) a.cover = s.cover;
      map.set(name, a);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [songs]);

  const [view, setView] = useState<View>({ type: "all" });
  const [q, setQ] = useState("");

  // Lista visible según la vista (todas mezcladas, favoritas o por artista)
  const list = useMemo(() => {
    let l = songs;
    if (view.type === "fav") l = l.filter((s) => likedIds.has(s.id));
    if (view.type === "artist") l = l.filter((s) => ((s.artist ?? "").trim() || "Campamento Shadday") === view.name);
    const t = q.trim().toLowerCase();
    if (t) l = l.filter((s) => s.title.toLowerCase().includes(t) || (s.artist ?? "").toLowerCase().includes(t));
    return l;
  }, [songs, view, likedIds, q]);

  const toggleLike = (songId: number) => likeMut.mutate({ songId });

  const viewTitle =
    view.type === "all" ? "Todas las Canciones"
    : view.type === "fav" ? "Mis Favoritas"
    : view.name;
  const viewSub =
    view.type === "all" ? "Toda la música del club, mezclada en un solo lugar"
    : view.type === "fav" ? "Tu playlist personal — solo tú la ves"
    : `${list.length} ${list.length === 1 ? "canción" : "canciones"} de este artista`;
  const viewCover =
    view.type === "artist"
      ? artists.find((a) => a.name === (view as { name: string }).name)?.cover ?? null
      : null;

  return (
    <div className="page music-page">
      <nav className="page-nav">
        <div className="hs-container">
          <Link to="/" className="brand">
            <img src="/assets/logo-club.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--orange)", objectFit: "cover" }} />
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>
              Huellas de Shadday
              <small style={{ display: "block", fontSize: ".62rem", color: "var(--orange2)", letterSpacing: ".22em", textTransform: "uppercase" }}>Música del Club</small>
            </span>
          </Link>
          <Link to="/" className="btn-ghost" style={{ padding: ".55rem 1.3rem", fontSize: ".85rem" }}>← Volver</Link>
        </div>
      </nav>

      {songsQ.isLoading ? (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: "4rem 0" }}>Afinando los instrumentos…</p>
      ) : songs.length === 0 ? (
        <div className="hs-container page-body" style={{ maxWidth: 860 }}>
          <div className="music-hero empty">
            <div className="music-glow" />
            <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
              <div className="music-disc" style={{ margin: "0 auto 1.4rem" }}>
                <img src="/assets/logo-club.png" alt="Campamento Shadday" />
                <div className="disc-hole" />
              </div>
              <h1 style={{ fontFamily: "Oswald, sans-serif", letterSpacing: ".04em", fontSize: "clamp(1.5rem, 4vw, 2.1rem)" }}>
                LA MÚSICA DEL CLUB
              </h1>
              <p style={{ color: "var(--muted)", maxWidth: 460, margin: ".7rem auto 0", fontSize: ".93rem", lineHeight: 1.6 }}>
                Aquí sonarán los himnos y canciones que la directiva suba para el club:
                alabanzas, coros de conquistadores y música para la fogata. ¡Vuelve pronto!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="sp-wrap">
          {/* BARRA LATERAL — TU BIBLIOTECA */}
          <aside className="sp-sidebar">
            <p className="sp-side-title">Tu biblioteca</p>
            <button className={`sp-side-item ${view.type === "all" ? "active" : ""}`} onClick={() => setView({ type: "all" })}>
              <span className="sp-side-thumb sp-thumb-all">🎵</span>
              <span><b>Todas las canciones</b><small>{songs.length} {songs.length === 1 ? "canción" : "canciones"} · mezcladas</small></span>
            </button>
            <button className={`sp-side-item ${view.type === "fav" ? "active" : ""}`} onClick={() => setView({ type: "fav" })}>
              <span className="sp-side-thumb sp-thumb-fav">❤️</span>
              <span><b>Mis favoritas</b><small>Tu playlist personal · {likedIds.size}</small></span>
            </button>
            <p className="sp-side-title" style={{ marginTop: "1.2rem" }}>Artistas</p>
            {artists.map((a) => (
              <button
                key={a.name}
                className={`sp-side-item ${view.type === "artist" && view.name === a.name ? "active" : ""}`}
                onClick={() => setView({ type: "artist", name: a.name })}
              >
                <span className="sp-side-thumb">
                  {a.cover ? <img src={a.cover} alt="" /> : "🎤"}
                </span>
                <span><b>{a.name}</b><small>{a.count} {a.count === 1 ? "canción" : "canciones"}</small></span>
              </button>
            ))}
          </aside>

          {/* PESTAÑAS MÓVILES */}
          <div className="sp-tabs">
            <button className={`lib-pill ${view.type === "all" ? "active" : ""}`} onClick={() => setView({ type: "all" })}>🎵 Todas</button>
            <button className={`lib-pill ${view.type === "fav" ? "active" : ""}`} onClick={() => setView({ type: "fav" })}>❤️ Favoritas</button>
            {artists.map((a) => (
              <button
                key={a.name}
                className={`lib-pill ${view.type === "artist" && view.name === a.name ? "active" : ""}`}
                onClick={() => setView({ type: "artist", name: a.name })}
              >
                🎤 {a.name}
              </button>
            ))}
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <main className="sp-main">
            <div className="sp-view-head">
              <div className={`sp-view-cover ${view.type === "fav" ? "fav" : ""} ${view.type === "all" ? "all" : ""}`}>
                {view.type === "fav" ? "❤️" : view.type === "all" ? "🎵" : viewCover ? <img src={viewCover} alt="" /> : "🎤"}
              </div>
              <div style={{ minWidth: 0 }}>
                <span className="db-tag">{view.type === "artist" ? "Artista" : "Playlist"}</span>
                <h1>{viewTitle}</h1>
                <p>{viewSub}</p>
              </div>
            </div>

            <div className="comment-form sp-search">
              <input
                type="text"
                placeholder="🔍 Buscar en esta lista…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {list.length === 0 ? (
              <div className="podio-empty" style={{ margin: "1.4rem 0" }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="1.6"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" /></svg>
                <p>
                  {view.type === "fav"
                    ? "Tu playlist está vacía. Toca el ❤️ en cualquier canción para guardarla aquí."
                    : "No hay canciones en esta vista con esa búsqueda."}
                </p>
              </div>
            ) : (
              <div className="song-list" style={{ paddingBottom: "7.5rem" }}>
                {list.map((s, i) => {
                  const liked = likedIds.has(s.id);
                  const isCurrent = player.current?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`song-row ${isCurrent ? "current" : ""}`}
                      onClick={() => player.playList(list, i)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") player.playList(list, i); }}
                    >
                      <span className="song-num">
                        {isCurrent && player.playing ? (
                          <span className="mini-eq"><i /><i /><i /></span>
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <span className="song-cover">
                        <img src={s.cover || "/assets/logo-club.png"} alt="" />
                      </span>
                      <span className="song-meta">
                        <b>{s.title}</b>
                        <small>{(s.artist ?? "").trim() || "Campamento Shadday"}</small>
                      </span>
                      <button
                        className={`song-heart ${liked ? "liked" : ""}`}
                        title={liked ? "Quitar de tus favoritas" : "Guardar en tus favoritas"}
                        onClick={(e) => { e.stopPropagation(); toggleLike(s.id); }}
                      >
                        {liked ? "❤️" : "🤍"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
