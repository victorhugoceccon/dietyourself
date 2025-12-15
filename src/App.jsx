import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './components/Login'
import Paciente from './components/Paciente'
import Nutricionista from './components/Nutricionista'
import Personal from './components/Personal'
import { getRoleRedirect } from './utils/roleRedirect'
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
    const redirectPath = getRoleRedirect(userData.role)
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
          <Route path="/login" element={<Login />} />
          <Route 
            path="/paciente" 
            element={
              <ProtectedRoute>
                <Paciente />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nutricionista" 
            element={
              <ProtectedRoute>
                <Nutricionista />
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
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
