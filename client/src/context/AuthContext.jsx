import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('hrms_token');
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (err) {
            localStorage.removeItem('hrms_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('hrms_token', token);
            setUser(userData);
            return userData;
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('hrms_token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
