import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'
import ItemForm from './pages/ItemForm'
import ItemDetail from './pages/ItemDetail'
import { MyClaims, MyItems, Notifications, Profile } from './pages/MyPages'
import Admin from './pages/Admin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          <Route element={<AppLayout />}>
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/reportar" element={<ItemForm />} />
            <Route path="/objetos/:id" element={<ItemDetail />} />
            <Route path="/objetos/:id/editar" element={<ItemForm />} />
            <Route path="/mis-publicaciones" element={<MyItems />} />
            <Route path="/solicitudes" element={<MyClaims />} />
            <Route path="/notificaciones" element={<Notifications />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>

          <Route element={<AppLayout adminOnly />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
