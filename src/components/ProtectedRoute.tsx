import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '16px',
        backgroundColor: '#FAF9F6' 
      }}>
        <Loader2 className="animate-spin" size={40} color="var(--secondary-color)" />
        <span style={{ fontSize: '15px', color: '#757575', fontWeight: '600' }}>여정을 준비 중입니다...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
