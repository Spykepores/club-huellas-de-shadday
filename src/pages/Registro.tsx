import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import "../landing.css";

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

type Done = { profileCode: string; groupCode: string | null; groupMode: "create" | "join" };

export default function Registro() {
  const [form, setForm] = useState({
    fullName: "", documentId: "", birthDate: "", phone: "", email: "", address: "",
    eps: "", bloodType: "", allergies: "", medications: "", medicalConditions: "",
    emergencyContactName: "", emergencyContactPhone: "",
    groupMode: "create" as "create" | "join",
    groupName: "", groupCode: "",
  });
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const register = trpc.camp.register.useMutation({
    onSuccess: (data) => {
      setDone({ profileCode: data.profileCode, groupCode: data.groupCode, groupMode: form.groupMode });
      const s = new Audio("/assets/sonido_registro.mp3");
      s.volume = 0.8;
      s.play().catch(() => {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e) => setError(e.message),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    register.mutate(form);
  };

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

      <div className="hs-container page-body">
        {done ? (
          <div className="success-card">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#5f8a6b" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>
            <h2 style={{ fontSize: "1.5rem" }}>¡Registro Exitoso!</h2>
            <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>
              Tu cupo quedó solicitado. La directiva confirmará tu inscripción y asignará puntos y logros a tu perfil.
            </p>
            {done.groupMode === "create" && done.groupCode && (
              <div>
                <p style={{ fontSize: ".8rem", color: "var(--muted)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: ".5rem" }}>Código de enlace de tu grupo — compártelo con tus compañeros</p>
                <span className="code-display">{done.groupCode}</span>
              </div>
            )}
            <div>
              <p style={{ fontSize: ".8rem", color: "var(--muted)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: ".5rem" }}>Tu código de perfil — guárdalo para ver tu ranking y logros</p>
              <span className="code-display">{done.profileCode}</span>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: ".6rem" }}>
              <Link to={`/perfil/${done.profileCode}`} className="btn-primary">Ver mi Perfil</Link>
              <Link to="/" className="btn-ghost">Volver al Inicio</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 2.5rem" }}>
              <div className="section-tag" style={{ justifyContent: "center" }}>Ficha de Inscripción</div>
              <h2>Registro del Conquistador</h2>
              <p className="section-intro" style={{ margin: "1rem auto 0" }}>
                Diligencia tu ficha completa. Los datos de salud son confidenciales y solo los verá la directiva
                para garantizar tu seguridad durante el desafío.
              </p>
              {user ? (
                <p style={{ marginTop: ".8rem", fontSize: ".85rem", color: "var(--orange2)" }}>
                  ✓ Sesión iniciada como {user.name ?? "conquistador"} — tu ficha quedará vinculada a tu cuenta y tus logros se guardarán en "Mi Perfil".
                </p>
              ) : (
                <p style={{ marginTop: ".8rem", fontSize: ".85rem", color: "var(--muted)" }}>
                  Consejo: <Link to="/mi-perfil" style={{ color: "var(--orange2)", textDecoration: "underline" }}>inicia sesión</Link> antes de registrarte para que tus logros se guarden en tu cuenta.
                </p>
              )}
            </div>

            <form className="form-card" onSubmit={submit}>
              <div className="form-section-title">Datos Personales</div>
              <div className="field">
                <label>Nombre completo *</label>
                <input value={form.fullName} onChange={set("fullName")} placeholder="Nombres y apellidos" required />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Documento de identidad</label>
                  <input value={form.documentId} onChange={set("documentId")} placeholder="Ej: 1020..." />
                </div>
                <div className="field">
                  <label>Fecha de nacimiento</label>
                  <input type="date" value={form.birthDate} onChange={set("birthDate")} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Teléfono / WhatsApp *</label>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="300 000 0000" required />
                </div>
                <div className="field">
                  <label>Correo electrónico</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@ejemplo.com" />
                </div>
              </div>
              <div className="field">
                <label>Dirección de residencia</label>
                <input value={form.address} onChange={set("address")} placeholder="Barrio, ciudad" />
              </div>

              <div className="form-section-title">Ficha de Salud</div>
              <div className="form-row">
                <div className="field">
                  <label>EPS</label>
                  <input value={form.eps} onChange={set("eps")} placeholder="Ej: Sanitas, Sura, Nueva EPS…" />
                </div>
                <div className="field">
                  <label>Tipo de sangre</label>
                  <select value={form.bloodType} onChange={set("bloodType")}>
                    <option value="">Selecciona…</option>
                    {bloodTypes.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Alergias</label>
                <textarea value={form.allergies} onChange={set("allergies")} placeholder="Alimentos, medicamentos, insectos… (escribe 'Ninguna' si no aplica)" />
              </div>
              <div className="field">
                <label>Medicamentos que toma actualmente</label>
                <textarea value={form.medications} onChange={set("medications")} placeholder="Nombre y dosis (escribe 'Ninguno' si no aplica)" />
              </div>
              <div className="field">
                <label>Condiciones médicas</label>
                <textarea value={form.medicalConditions} onChange={set("medicalConditions")} placeholder="Asma, diabetes, lesiones recientes…" />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Contacto de emergencia</label>
                  <input value={form.emergencyContactName} onChange={set("emergencyContactName")} placeholder="Nombre del acudiente" />
                </div>
                <div className="field">
                  <label>Teléfono de emergencia</label>
                  <input type="tel" value={form.emergencyContactPhone} onChange={set("emergencyContactPhone")} placeholder="300 000 0000" />
                </div>
              </div>

              <div className="form-section-title">Tu Grupo</div>
              <div className="field">
                <div className="group-toggle">
                  <label className="group-option">
                    <input type="radio" name="grupoTipo" checked={form.groupMode === "create"} onChange={() => setForm((f) => ({ ...f, groupMode: "create" }))} />
                    <span>
                      <b>Crear mi propio grupo</b>
                      <small>Le das un nombre y recibes un código de enlace para invitar a tus compañeros</small>
                    </span>
                  </label>
                  <label className="group-option">
                    <input type="radio" name="grupoTipo" checked={form.groupMode === "join"} onChange={() => setForm((f) => ({ ...f, groupMode: "join" }))} />
                    <span>
                      <b>Unirme a un grupo</b>
                      <small>Ingresa el código de enlace que te compartió tu compañero</small>
                    </span>
                  </label>
                </div>
              </div>
              {form.groupMode === "create" ? (
                <div className="field">
                  <label>Nombre del Grupo *</label>
                  <input value={form.groupName} onChange={set("groupName")} placeholder="Ej: Los Rastreadores" maxLength={30} required />
                  <small className="field-hint">Al registrarte recibirás el código de enlace del grupo para compartirlo.</small>
                </div>
              ) : (
                <div className="field">
                  <label>Código de enlace del grupo *</label>
                  <input value={form.groupCode} onChange={set("groupCode")} placeholder="Ej: SHD-4X7K" maxLength={10} style={{ textTransform: "uppercase" }} required />
                  <small className="field-hint">Pídele el código al compañero que creó el grupo.</small>
                </div>
              )}

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" className="btn-primary" style={{ justifyContent: "center", width: "100%" }} disabled={register.isPending}>
                {register.isPending ? "Registrando…" : "Asegurar mi Cupo (Cupos Limitados)"}
              </button>
              <p style={{ fontSize: ".78rem", color: "var(--muted)", textAlign: "center" }}>
                Al registrarte aceptas las reglas de supervivencia del campamento y la autorización de los acudientes.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
