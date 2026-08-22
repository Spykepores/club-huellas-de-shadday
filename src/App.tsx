import { Routes, Route, Navigate, useLocation } from 'react-router'
import ChatWidget from './components/ChatWidget'
import PlayerBar from './components/PlayerBar'
import { PlayerProvider } from './providers/player'
import Home from './pages/Home'
import Desafio from './pages/Desafio'
import Registro from './pages/Registro'
import MiPerfil from './pages/MiPerfil'
import Perfil from './pages/Perfil'
import Explorar from './pages/Explorar'
import Biblioteca from './pages/Biblioteca'
import Musica from './pages/Musica'
import Admin from './pages/Admin'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import { useAuth } from "@/hooks/useAuth"
import { Toaster } from "@/components/ui/sonner"
import "./landing.css"

function AuthLoading() {
  return (
    <div className="auth-gate">
      <img src="/assets/logo-club.png" alt="Campamento Shadday" />
      <div className="auth-gate-spinner" />
      <p>Preparando el campamento…</p>
    </div>
  )
}

// Toda la app requiere sesión: sin login solo se ve la página de ingreso
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Chat del club: visible en todas las páginas cuando hay sesión
function ChatGate() {
  const { user, isLoading } = useAuth()
  const loc = useLocation()
  if (isLoading || !user || loc.pathname === "/login") return null
  return <ChatWidget />
}

export default function App() {
  return (
    <>
    <PlayerProvider>
    <Routes>
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/desafio" element={<RequireAuth><Desafio /></RequireAuth>} />
      <Route path="/registro" element={<RequireAuth><Registro /></RequireAuth>} />
      <Route path="/mi-perfil" element={<RequireAuth><MiPerfil /></RequireAuth>} />
      <Route path="/perfil/:code" element={<RequireAuth><Perfil /></RequireAuth>} />
      <Route path="/explorar" element={<RequireAuth><Explorar /></RequireAuth>} />
      <Route path="/biblioteca" element={<RequireAuth><Biblioteca /></RequireAuth>} />
      <Route path="/musica" element={<RequireAuth><Musica /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
    </Routes>
    <PlayerBar />
    </PlayerProvider>
    <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: "#16281f", border: "1px solid rgba(255,255,255,.14)", color: "#f2efe8" } }} />
    <ChatGate />
    </>
  )
}
