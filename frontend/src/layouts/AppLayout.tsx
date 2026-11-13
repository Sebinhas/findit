import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { Bell, FileText, Home, Inbox, LogOut, Menu, PlusCircle, Search, Shield, User, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { Spinner } from '../components/ui'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-white"><Search className="size-4" strokeWidth={2.5} /></span>
      FindIt
    </Link>
  )
}

const nav = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/explorar', label: 'Explorar', icon: Search },
  { to: '/reportar', label: 'Reportar objeto', icon: PlusCircle },
  { to: '/mis-publicaciones', label: 'Mis publicaciones', icon: FileText },
  { to: '/solicitudes', label: 'Solicitudes', icon: Inbox },
  { to: '/perfil', label: 'Mi perfil', icon: User },
]

function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0)
  const location = useLocation()
  useEffect(() => {
    if (!userId) return
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)
      .then(({ count }) => setCount(count ?? 0))
  }, [userId, location.pathname])
  return count
}

/** Layout para rutas privadas. Redirige a /login si no hay sesión (también al cerrar sesión). */
export function AppLayout({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, profile, loading, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const unread = useUnreadCount(session?.user.id)

  useEffect(() => setOpen(false), [location.pathname])

  if (loading) return <Spinner className="h-screen items-center" />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !isAdmin) return <Navigate to="/inicio" replace />

  const links = isAdmin ? [...nav, { to: '/admin', label: 'Administración', icon: Shield }] : nav
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <button className="rounded-md p-1.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Logo />
          <nav className="ml-6 hidden gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-blue-50 text-primary' : 'text-muted hover:text-ink')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/notificaciones" className="relative rounded-full p-2 text-muted hover:bg-slate-100 hover:text-ink" aria-label="Notificaciones">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link to="/perfil" className="grid size-8 place-items-center overflow-hidden rounded-full bg-primary-dark text-xs font-semibold text-white" title="Mi perfil">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="size-full object-cover" /> : initials}
            </Link>
            <button onClick={signOut}
              className="hidden rounded-full p-2 text-muted hover:bg-slate-100 hover:text-ink sm:block" title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
        {open && (
          <nav className="animate-fade-in border-t border-slate-200 bg-white px-4 py-2 lg:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                  isActive ? 'bg-blue-50 text-primary' : 'text-ink')}>
                <l.icon className="size-4" />{l.label}
              </NavLink>
            ))}
            <button onClick={signOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-danger">
              <LogOut className="size-4" />Cerrar sesión
            </button>
          </nav>
        )}
      </header>
      {profile && !profile.is_active && (
        <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">
          Tu cuenta está bloqueada{profile.blocked_reason ? `: ${profile.blocked_reason}` : ''}. Solo puedes consultar información.
        </div>
      )}
      <main className="animate-fade-in mx-auto max-w-7xl px-4 py-8"><Outlet /></main>
    </div>
  )
}
