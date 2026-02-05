import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboards = {
            admin: '/admin',
            manager: '/manager',
            hr: '/hr',
            employee: '/employee'
        };
        return <Navigate to={dashboards[user.role] || '/login'} replace />;
    }

    return children;
}

// Auto-redirect based on role
function RoleRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const dashboards = {
        admin: '/admin',
        manager: '/manager',
        hr: '/hr',
        employee: '/employee'
    };

    return <Navigate to={dashboards[user.role] || '/login'} replace />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/admin/*" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/manager/*" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/hr/*" element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <HRDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/employee/*" element={
                        <ProtectedRoute allowedRoles={['employee']}>
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={<RoleRedirect />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
