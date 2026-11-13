import { Link, Navigate } from 'react-router'
import { ArrowRight, BellRing, Handshake, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '../layouts/AppLayout'
import { useAuth } from '../contexts/AuthContext'

const features = [
  { icon: Search, title: 'Catálogo centralizado', text: 'Todos los objetos perdidos y encontrados de tu campus en un solo lugar, con filtros por categoría, lugar y fecha.' },
  { icon: Sparkles, title: 'Coincidencias automáticas', text: 'Al publicar, FindIt compara tu reporte con los del tipo opuesto y te avisa si encuentra algo parecido.' },
  { icon: ShieldCheck, title: 'Reclamaciones verificadas', text: 'Quien encontró el objeto guarda detalles privados para comprobar que eres el verdadero dueño.' },
  { icon: BellRing, title: 'Notificaciones', text: 'Entérate cuando alguien reclama tu publicación, acepta tu solicitud o aparece una coincidencia.' },
]

const steps = ['Publica lo que perdiste o encontraste', 'FindIt busca coincidencias', 'Envía una solicitud de recuperación', 'Coordinen la entrega y confirmen']

export default function Landing() {
  const { session, loading } = useAuth()
  if (!loading && session) return <Navigate to="/inicio" replace />

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex gap-2">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Iniciar sesión</Link>
          <Link to="/registro" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark">Crear cuenta</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-primary">
          <Handshake className="size-3.5" /> Objetos perdidos de tu universidad
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Lo que pierdes, <span className="text-primary">alguien lo encuentra.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Deja de buscar en grupos de WhatsApp. FindIt centraliza los reportes, encuentra coincidencias y te ayuda a recuperar tus cosas de forma segura.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/registro" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-white shadow-sm hover:bg-primary-dark">
            Empezar ahora <ArrowRight className="size-4" />
          </Link>
          <Link to="/login" className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-medium shadow-sm hover:bg-slate-50">Ya tengo cuenta</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-2.5 text-primary"><f.icon className="size-5" /></div>
            <h3 className="font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-semibold tracking-tight">¿Cómo funciona?</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">{i + 1}</span>
                <p className="pt-1 text-sm font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted">FindIt · Proyecto universitario</footer>
    </div>
  )
}
