import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import PacienteLayout from './components/PacienteLayout'
import PacienteDashboard from './components/PacienteDashboard'
import PacienteDieta from './components/PacienteDieta'
import PacienteTreino from './components/PacienteTreino'
import PacientePerfil from './components/PacientePerfil'
import PacienteProjetos from './components/PacienteProjetos'
import ProjetoDetalhe from './components/ProjetoDetalhe'
import Nutricionista from './components/Nutricionista'
import Personal from './components/Personal'
import Admin from './components/Admin'
import EditPatientDietPage from './components/EditPatientDietPage'
import { getRoleRedirect } from './utils/roleRedirect'
import Landing from './pages/Landing'
import BillingSuccess from './pages/BillingSuccess'
import BillingCancel from './pages/BillingCancel'
import ConviteProjeto from './components/ConviteProjeto'
import './App.css'

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Componente de redirecionamento baseado em role
const RoleRedirect = () => {
  const user = localStorage.getItem('user')
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  try {
    const userData = JSON.parse(user)
    const redirectPath = getRoleRedirect(userData)
    return <Navigate to={redirectPath} replace />
  } catch (error) {
    return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel" element={<BillingCancel />} />
          <Route path="/convite/:codigo" element={<ConviteProjeto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/paciente" 
            element={
              <ProtectedRoute>
                <PacienteLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/paciente/perfil" replace />} />
            <Route path="dashboard" element={<PacienteDashboard />} />
            <Route path="dieta" element={<PacienteDieta />} />
            <Route path="treino" element={<PacienteTreino />} />
            <Route path="projetos" element={<PacienteProjetos />} />
            <Route path="projetos/:grupoId" element={<ProjetoDetalhe />} />
            <Route path="perfil" element={<PacientePerfil />} />
          </Route>
          <Route 
            path="/nutricionista" 
            element={
              <ProtectedRoute>
                <Nutricionista />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nutricionista/pacientes/:pacienteId/editar-dieta" 
            element={
              <ProtectedRoute>
                <EditPatientDietPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/personal" 
            element={
              <ProtectedRoute>
                <Personal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
