import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Fetch user data
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    // If token is invalid, redirect to login
                    localStorage.removeItem('token');
                    navigate('/');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (loading) {
        return <div className={styles.loadingContainer}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.logo}>Financial Analytics Dashboard</h1>
                <div className={styles.userInfo}>
                    <span>Welcome, {user?.username || 'User'}</span>
                    <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.welcomeSection}>
                    <h2>Welcome to your Financial Dashboard</h2>
                    <p>Track your finances, manage expenses, and gain insights into your spending habits.</p>
                </div>

                <div className={styles.dashboardGrid}>
                    <div className={styles.card}>
                        <h3>Recent Transactions</h3>
                        <div className={styles.placeholder}>
                            <p>Your recent transactions will appear here.</p>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3>Spending Overview</h3>
                        <div className={styles.placeholder}>
                            <p>Your spending overview will appear here.</p>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3>Budget Status</h3>
                        <div className={styles.placeholder}>
                            <p>Your budget status will appear here.</p>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3>Financial Goals</h3>
                        <div className={styles.placeholder}>
                            <p>Your financial goals will appear here.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <p>© 2024 Financial Analytics Dashboard. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;