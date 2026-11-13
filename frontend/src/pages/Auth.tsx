import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { errorMessage } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../layouts/AppLayout'
import { Alert, Button, Card, Field, Input } from '../components/ui'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md p-8">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </Card>
    </div>
  )
}

export function Login() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/inicio'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) return setError(errorMessage(error))
    navigate(from, { replace: true })
  }

  return (
    <AuthShell title="Bienvenido de nuevo" subtitle={<>¿No tienes cuenta? <Link to="/registro" className="font-medium text-primary hover:underline">Regístrate</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Correo electrónico"><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contraseña"><Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button type="submit" loading={loading} className="w-full">Iniciar sesión</Button>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/inicio" replace />
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setInfo('')
    if (form.first_name.trim().length < 2 || form.last_name.trim().length < 2) return setError('Ingresa tu nombre y apellido')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { first_name: form.first_name.trim(), last_name: form.last_name.trim() } },
    })
    setLoading(false)
    if (error) return setError(errorMessage(error))
    if (!data.session) return setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
    navigate('/inicio', { replace: true })
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle={<>¿Ya tienes una? <Link to="/login" className="font-medium text-primary hover:underline">Inicia sesión</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {info && <Alert tone="green">{info}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre"><Input required value={form.first_name} onChange={set('first_name')} autoComplete="given-name" /></Field>
          <Field label="Apellido"><Input required value={form.last_name} onChange={set('last_name')} autoComplete="family-name" /></Field>
        </div>
        <Field label="Correo electrónico"><Input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres"><Input type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirmar contraseña"><Input type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        <Button type="submit" loading={loading} className="w-full">Crear cuenta</Button>
      </form>
    </AuthShell>
  )
}
