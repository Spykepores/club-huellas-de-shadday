import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import ShareButtons from "@/components/ShareButtons";
import { useAuth } from "@/hooks/useAuth";
import RadioButton from "@/components/RadioButton";
import "../landing.css";

const days = [
  {
    num: "01",
    title: "La Llegada — Dejar la Zona de Confort",
    sub: "Instalación, revisión de mochilas y primer rally",
    items: [
      ["08:00", "Recepción y revisión de mochila estricta", " en la entrada de la sede."],
      ["10:00", "Ceremonia de apertura", " y formación de grupos de expedición."],
      ["12:00", "Rally de orientación", " — brújula, mapa y pistas por el terreno de la sede."],
      ["17:00", "Montaje de campamento", " — cada grupo levanta su propia zona de carpas."],
      ["20:00", "Fogata de bienvenida", " y culto de apertura bajo las estrellas."],
    ],
  },
  {
    num: "02",
    title: "Resistencia — El Cuerpo al Límite",
    sub: "Pruebas deportivas y circuito de obstáculos",
    items: [
      ["06:00", "Despertar con ejercicio", " — trote matutino y devocional personal."],
      ["09:00", "Circuito de obstáculos", " — muro, cuerdas, arrastre y equilibrio."],
      ["14:00", "Pruebas deportivas por grupos", " — relevos, resistencia y puntería. Suman puntos al podio."],
      ["17:00", "Especialidad de campismo", " — nudos, amarres y construcciones pioneras."],
      ["20:00", "Culto nocturno", " — \"Firme en Sus pisadas: caminar como Él caminó\"."],
    ],
  },
  {
    num: "03",
    title: "Supervivencia — La Noche del Rastreo",
    sub: "Cocina de campo, rastreo nocturno y prueba de fuego",
    items: [
      ["07:00", "Cocina de campo", " — cada grupo prepara su desayuno a leña."],
      ["10:00", "Taller de supervivencia", " — fuego sin fósforos, agua segura y refugio."],
      ["15:00", "Rally de rastreo", " — identificación de huellas, señales y lectura del terreno."],
      ["19:00", "Expedición nocturna", " — recorrido guiado por brújula y estrellas."],
      ["21:30", "Fogata y testimonios", " — momentos de gratitud alrededor del fuego."],
    ],
  },
  {
    num: "04",
    title: "La Cumbre — Premiación y Compromiso",
    sub: "Última prueba, ceremonia de cierre y despedida",
    items: [
      ["07:00", "Gran rally final", " — todas las habilidades en una sola competencia."],
      ["11:00", "Desmontaje de campamento", " — dejamos el terreno mejor de lo que lo encontramos."],
      ["13:00", "Almuerzo de confraternidad", " con las familias invitadas."],
      ["15:00", "Ceremonia de premiación", " — entrega del podio de grupos y logros individuales."],
      ["17:00", "Despedida", " — \"Que cada huella cuente la historia de quién te guía\"."],
    ],
  },
];

const permitido = [
  ["Uniforme completo", " y ropa de campo para 4 días"],
  ["Botella de agua", " personal (mínimo 1 litro)"],
  ["Carpa y sleeping bag", " — equipo de pernocta"],
  ["Biblia, himnario y libreta", " de especialidades"],
  ["Linterna", " con pilas de repuesto"],
  ["Kit de higiene", " y botiquín personal básico"],
  ["Celular — uso controlado", ": queda custodiado por el consejero y solo se usa en el horario de comunicación con la familia"],
];

const prohibido = [
  ["Tablets y videojuegos", " — el celular es el único dispositivo permitido (con uso controlado)"],
  ["Snacks, dulces y gaseosas", " — la cocina de campo provee todo"],
  ["Consolas y audífonos", " — ningún otro dispositivo electrónico"],
  ["Dinero en efectivo", " — no habrá ventas dentro del campamento"],
  ["Objetos de valor", " — el club no se responsabiliza por pérdidas"],
  ["Cuchillos o elementos cortantes", " sin autorización del consejero"],
];

function useCountdown() {
  const [target] = useState(() => {
    const now = new Date();
    let t = new Date(now.getFullYear(), 10, 2, 0, 0, 0); // 2 de noviembre
    if (t.getTime() <= now.getTime()) t = new Date(now.getFullYear() + 1, 10, 2, 0, 0, 0);
    return t;
  });
  const [diff, setDiff] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const s = Math.max(0, Math.floor(diff / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    sec: s % 60,
  };
}

export default function Desafio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDay, setOpenDay] = useState(0);
  const starsRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const cd = useCountdown();

  // Estrellas del hero
  useEffect(() => {
    const wrap = starsRef.current;
    if (!wrap) return;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("span");
      const size = Math.random() * 2.2 + 0.6;
      s.style.cssText = `position:absolute;top:${Math.random() * 55}%;left:${Math.random() * 100}%;
        width:${size}px;height:${size}px;border-radius:50%;background:#f2efe8;
        opacity:${(Math.random() * 0.5 + 0.15).toFixed(2)};
        animation:twinkle ${(Math.random() * 3 + 2).toFixed(1)}s infinite ${(Math.random() * 3).toFixed(1)}s alternate`;
      wrap.appendChild(s);
    }
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="hs-nav">
        <div className="hs-container nav-inner">
          <Link to="/" className="brand">
            <img src="/assets/logo-seven.png" alt="Logo Huellas de Shadday" />
            <span>
              Huellas de Shadday
              <small>Desafío Seven</small>
            </span>
          </Link>
          <ul className="nav-links">
            <li><a href="#evento">El Evento</a></li>
            <li><a href="#reglas">Reglas</a></li>
            <li><a href="#itinerario">Itinerario</a></li>
            <li><Link to="/">El Club</Link></li>
            <li><Link to="/musica">Música</Link></li>
            {user ? (
              <li className="nav-user">
                <Link to={user.role === "admin" ? "/admin" : "/mi-perfil"}>{user.role === "admin" ? "Panel Directiva" : "Mi Perfil"}</Link>
                <button className="nav-logout" title="Cerrar sesión" onClick={logout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                </button>
              </li>
            ) : (
              <li><Link to="/mi-perfil">Ingresar</Link></li>
            )}
            <li><Link to="/registro" className="nav-cta">Asegurar mi Cupo</Link></li>
          </ul>
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            aria-label="Menú"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <a href="#evento" onClick={() => setMenuOpen(false)}>El Evento</a>
        <a href="#reglas" onClick={() => setMenuOpen(false)}>Reglas</a>
        <a href="#itinerario" onClick={() => setMenuOpen(false)}>Itinerario</a>
        <Link to="/" onClick={() => setMenuOpen(false)}>🏕️ El Club</Link>
        <Link to="/musica" onClick={() => setMenuOpen(false)}>🎵 Música</Link>
        <Link to={user ? (user.role === "admin" ? "/admin" : "/mi-perfil") : "/mi-perfil"} onClick={() => setMenuOpen(false)}>
          {user ? (user.role === "admin" ? "Panel Directiva" : "Mi Perfil") : "Ingresar"}
        </Link>
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); logout(); }} style={{ color: "#e8a89f" }}>
            Cerrar Sesión
          </a>
        )}
        <Link to="/registro" style={{ color: "var(--orange2)" }}>Asegurar mi Cupo</Link>
      </div>

      {/* HERO */}
      <header className="hero" id="inicio">
        <div className="hero-stars" ref={starsRef}></div>
        <svg className="hero-mountains" viewBox="0 0 1440 420" preserveAspectRatio="none" style={{ height: "46vh", minHeight: 280 }}>
          <path d="M0 420 L0 300 L180 180 L300 260 L460 120 L620 280 L760 200 L920 320 L1080 160 L1240 300 L1440 220 L1440 420 Z" fill="#16281f" opacity=".55" />
          <path d="M0 420 L0 340 L140 250 L320 340 L500 210 L680 350 L860 260 L1040 360 L1220 250 L1440 340 L1440 420 Z" fill="#101a15" opacity=".85" />
          <path d="M0 420 L0 368 L220 322 L420 372 L640 308 L880 368 L1120 330 L1440 372 L1440 420 Z" fill="#0b1210" />
          <path d="M0 420 L0 396 Q360 378 720 390 T1440 392 L1440 420 Z" fill="#16303a" opacity=".9" />
          <path d="M240 402 Q480 394 720 400" stroke="#e2792f" strokeWidth="2" fill="none" opacity=".35" strokeLinecap="round" />
          <path d="M560 409 Q820 402 1100 407" stroke="#f2efe8" strokeWidth="1.5" fill="none" opacity=".18" strokeLinecap="round" />
          <path d="M880 398 Q1060 393 1260 397" stroke="#f0954d" strokeWidth="1.5" fill="none" opacity=".25" strokeLinecap="round" />
        </svg>
        <div className="hero-content">
          <div className="hero-badge">Desafío Seven · Campamento Shadday · Diciembre</div>
          <h1>Firme en<br />Sus <em>Pisadas</em></h1>
          <p className="subtitle">
            <strong>El Desafío de Supervivencia</strong> — 4 días de rallies, pruebas deportivas y vida de campamento en nuestra nueva sede.
          </p>
          <div className="hero-cta">
            <Link to="/registro" className="btn-primary">
              Asegurar mi Cupo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <a href="#evento" className="btn-ghost">Conocer el desafío</a>
          </div>
          <div className="hero-meta">
            <div><strong>4</strong>Días</div>
            <div><strong>Diciembre</strong>Fecha</div>
            <div><strong>Nueva Sede</strong>Lugar</div>
            <div><strong>Limitados</strong>Cupos</div>
          </div>
          <div className="countdown">
            <div className="countdown-cell"><b>{cd.d}</b><span>Días</span></div>
            <div className="countdown-cell"><b>{String(cd.h).padStart(2, "0")}</b><span>Horas</span></div>
            <div className="countdown-cell"><b>{String(cd.m).padStart(2, "0")}</b><span>Min</span></div>
            <div className="countdown-cell"><b>{String(cd.sec).padStart(2, "0")}</b><span>Seg</span></div>
          </div>
          <p className="countdown-label">para la inauguración de la sede · 2 de noviembre</p>
        </div>
        <div className="scroll-hint">Desliza</div>
      </header>

      {/* ABOUT */}
      <section className="about" id="evento">
        <div className="hs-container about-grid">
          <div className="reveal">
            <div className="section-tag">El Evento</div>
            <h2>Cuatro días que pondrán a prueba tu carácter</h2>
            <p className="section-intro">
              <strong style={{ color: "var(--text)" }}>"Desafío Seven: Firme en Sus Pisadas"</strong> es el primer gran campamento de supervivencia
              del Club Huellas de Shadday en nuestra nueva sede. Durante 4 días, los conquistadores enfrentarán
              rallies de orientación, pruebas deportivas y la experiencia auténtica de la vida de campamento —
              sin comodidades, sin atajos, con mochila estricta.
            </p>
            <ul className="about-list">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6l2.5 5.5L20 13l-5.5 1.5L12 20l-2.5-5.5L4 13l5.5-1.5z" /></svg>
                <span><strong style={{ color: "var(--text)" }}>Rallies de supervivencia</strong> — orientación con brújula, rastreo y trabajo en grupo.</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
                <span><strong style={{ color: "var(--text)" }}>Pruebas deportivas</strong> — resistencia, fuerza y agilidad que suman puntos al podio.</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><path d="M12 2l9 18H3L12 2z" /><path d="M12 10v10" /></svg>
                <span><strong style={{ color: "var(--text)" }}>Vida de campamento</strong> — cocina de campo, fogatas, cultos bajo las estrellas y la orilla del lago.</span>
              </li>
            </ul>
          </div>
          <div className="about-visual reveal">
            <img src="/assets/logo-seven.png" alt="Insignia Campamento Shadday" />
          </div>
        </div>
      </section>

      {/* RULES */}
      <section id="reglas">
        <div className="hs-container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <div className="section-tag" style={{ justifyContent: "center" }}>Mochila Estricta</div>
            <h2>Las Reglas de Supervivencia</h2>
            <p className="section-intro" style={{ margin: "1rem auto 0" }}>
              En este desafío, cada conquistador carga solo lo esencial. La mochila será revisada
              a la entrada del campamento. Sin excepciones.
            </p>
          </div>
          <div className="rules-grid">
            <div className="rule-card allowed reveal">
              <h3>
                <span className="rule-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5f8a6b" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                Lo Permitido
              </h3>
              <ul>
                {permitido.map(([b, r], i) => (
                  <li key={i}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f8a6b" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 3 }}><path d="M20 6L9 17l-5-5" /></svg>
                    <span><strong>{b}</strong>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rule-card banned reveal">
              <h3>
                <span className="rule-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0574a" strokeWidth="2.4"><circle cx="12" cy="12" r="10" /><path d="M5.5 5.5l13 13" /></svg>
                </span>
                Prohibido
              </h3>
              <ul>
                {prohibido.map(([b, r], i) => (
                  <li key={i}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0574a" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 3 }}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    <span><strong>{b}</strong>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rule-note reveal">
            <strong>Nota:</strong> El celular <strong>no está prohibido</strong>: se recibe a la entrada, queda guardado de forma segura y se entrega cada día en el <strong>horario de llamadas</strong> para hablar con la familia. Los demás objetos prohibidos serán custodiados y devueltos al finalizar el campamento.
          </div>
        </div>
      </section>

      {/* ITINERARY */}
      <section className="itinerary" id="itinerario">
        <svg className="pines" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: 150 }}>
          <path d="M60 200 L90 110 L120 200 Z M150 200 L185 70 L220 200 Z M260 200 L285 120 L310 200 Z M350 200 L390 60 L430 200 Z M480 200 L505 115 L530 200 Z M580 200 L615 80 L650 200 Z M700 200 L725 120 L750 200 Z M800 200 L840 55 L880 200 Z M930 200 L955 110 L980 200 Z M1030 200 L1065 75 L1100 200 Z M1150 200 L1175 120 L1200 200 Z M1250 200 L1285 65 L1320 200 Z M1360 200 L1385 110 L1410 200 Z" fill="#0a120d" />
        </svg>
        <div className="hs-container">
          <div className="reveal">
            <div className="section-tag">Itinerario</div>
            <h2>Los 4 Días del Desafío</h2>
            <p className="section-intro">Cada día sube la intensidad. Toca cada jornada para ver el detalle.</p>
          </div>
          <div className="days">
            {days.map((d, i) => (
              <div className="reveal" key={i}>
                <div className={`day ${openDay === i ? "open" : ""}`}>
                  <button className="day-header" onClick={() => setOpenDay(openDay === i ? -1 : i)}>
                    <span className="day-num">{d.num}</span>
                    <span className="day-title">
                      <h3>{d.title}</h3>
                      <p>{d.sub}</p>
                    </span>
                    <svg className="day-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <div className="day-body">
                    <div className="day-body-inner">
                      {d.items.map(([t, b, r], j) => (
                        <div key={j}><span className="time">{t}</span><span><b>{b}</b>{r}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTER CTA */}
      <section id="registro">
        <div className="hs-container register-grid">
          <div className="reveal">
            <div className="section-tag">Registro</div>
            <h2>Asegura tu cupo para diciembre</h2>
            <p className="section-intro">
              Los cupos son limitados y se asignan por orden de inscripción. Completa tu ficha de registro
              con tus datos personales y de salud, crea tu grupo o únete con el código de un compañero,
              y empieza a acumular logros en el ranking.
            </p>
            <div className="inaug-card">
              <div className="date">2 de Noviembre</div>
              <h3>Inauguración Oficial de la Sede</h3>
              <p>
                Antes del campamento, te esperamos en la <strong style={{ color: "var(--text)" }}>inauguración oficial de nuestra
                nueva sede</strong> — el lugar donde viviremos el desafío. Conoce el terreno,
                las zonas de campamento y únete a la celebración.
              </p>
            </div>
          </div>
          <div className="cta-card reveal">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="1.5" style={{ margin: "0 auto" }}>
              <circle cx="12" cy="12" r="10" /><path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" />
            </svg>
            <h3>Ficha de Inscripción</h3>
            <p>Datos personales, ficha de salud (EPS, tipo de sangre, alergias) y creación de tu grupo con código de enlace.</p>
            <Link to="/registro" className="btn-primary" style={{ justifyContent: "center", width: "100%" }}>
              Asegurar mi Cupo (Cupos Limitados)
            </Link>
            <p className="cta-mini">Al registrarte recibirás tu <strong>código de perfil</strong> para consultar tu ranking y logros.</p>
            <div style={{ marginTop: "1.2rem", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "1rem" }}>
              <p className="cta-mini" style={{ marginBottom: 0 }}>¿Conoces a alguien que debería venir?</p>
              <ShareButtons path="/desafio" text="⛺ Desafío Seven — Firme en Sus Pisadas. 4 días de supervivencia, especialidades y aventura con el Club Huellas de Shadday. ¡Asegura tu cupo!" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="hs-container footer-inner">
          <div className="footer-brand">
            <img src="/assets/logo-seven.png" alt="Logo" />
            <span>Huellas de Shadday<small>Desafío Seven · "Firme en Sus Pisadas"</small></span>
          </div>
          <div style={{ color: "var(--muted)", fontSize: ".85rem", display: "flex", alignItems: "center", gap: ".6rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2792f" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" /></svg>
            Siguiendo Sus huellas, paso a paso.
          </div>
          <p className="copy">© {new Date().getFullYear()} Club de Conquistadores Huellas de Shadday. Todos los derechos reservados.</p>
        </div>
      </footer>

      <RadioButton />
    </div>
  );
}
