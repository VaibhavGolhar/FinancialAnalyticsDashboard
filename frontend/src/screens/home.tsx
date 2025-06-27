import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
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
                    // Fetch transactions after user is set
                    fetchTransactions(token);
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

        const fetchTransactions = async (token: string) => {
            try {
                const response = await fetch('/api/get-transactions', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data.data || []);
                } else {
                    setTransactions([]);
                }
            } catch (error) {
                setTransactions([]);
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
                        {transactions.length === 0 ? (
                            <div className={styles.placeholder}>
                                <p>No transactions found.</p>
                            </div>
                        ) : (
                            <div className={styles.transactionsTableWrapper}>
                                <table className={styles.transactionsTable}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((txn) => (
                                            <tr key={txn._id}>
                                                <td>{new Date(txn.date).toLocaleDateString()}</td>
                                                <td>{txn.description}</td>
                                                <td>{txn.category}</td>
                                                <td>{txn.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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