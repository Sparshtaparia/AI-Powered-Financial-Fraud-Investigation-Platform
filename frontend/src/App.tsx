import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewInvestigation from './pages/NewInvestigation'
import InvestigationDetails from './pages/InvestigationDetails'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore(s => s.token);
    if (!token) return <Navigate to="/login" />;
    return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/new" element={<ProtectedRoute><NewInvestigation /></ProtectedRoute>} />
                <Route path="/investigations/:id" element={<ProtectedRoute><InvestigationDetails /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}
