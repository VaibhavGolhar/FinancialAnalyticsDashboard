import {type JSX, useEffect, useState} from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Landing from './screens/landing'
import Home from './screens/home'

function App() {
    const [isHealthy, setIsHealthy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        fetch(`${apiBaseUrl}/api/health`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'OK') {
                    setIsHealthy(true);
                } else {
                    setError('API health check failed');
                }
            })
            .catch((err) => setError('Error: ' + err.message));
    }, []);

    // Check if user is authenticated
    const isAuthenticated = () => {
        return localStorage.getItem('token') !== null;
    };

    // Protected route component
    const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
        if (!isAuthenticated()) {
            return <Navigate to="/" replace />;
        }
        return children;
    };

    if (!isHealthy) {
        return <div>{error || 'Checking API health...'}</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route 
                    path="/home" 
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App
