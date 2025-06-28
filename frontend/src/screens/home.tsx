import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const transactionsPerPage = 10;
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
                    // Sort transactions by date (most recent first)
                    const sortedTransactions = (data.data || []).sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    setTransactions(sortedTransactions);
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

    // Pagination logic
    const totalPages = Math.ceil(transactions.length / transactionsPerPage);
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const currentTransactions = transactions.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    // Helper functions for amount sign and value
    const getSignedAmount = (transaction: any) => {
        // Defensive: treat missing/invalid category as expense
        if (transaction.category && transaction.category.toLowerCase() === 'revenue') return Math.abs(transaction.amount);
        if (transaction.category && transaction.category.toLowerCase() === 'expense') return -Math.abs(transaction.amount);
        return -Math.abs(transaction.amount); // fallback: treat as expense
    };
    const getAmountPrefix = (transaction: any) => {
        if (transaction.category && transaction.category.toLowerCase() === 'revenue') return '+';
        if (transaction.category && transaction.category.toLowerCase() === 'expense') return '-';
        return '-'; // fallback: treat as expense
    };

    // Updated calculations using category
    const balance = transactions.reduce((total, t) => total + getSignedAmount(t), 0);
    const totalRevenue = transactions.filter(t => t.category === 'revenue').reduce((total, t) => total + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.category === 'expense').reduce((total, t) => total + Math.abs(t.amount), 0);

    if (loading) {
        return <div className={styles.loadingContainer}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.logo}>FinSight</div>

                <div className={`${styles.navItem} ${styles.active}`}>
                    <div className={styles.navIcon}>▣</div>
                    <span>Dashboard</span>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navIcon}>⟷</div>
                    <span>Transactions</span>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navIcon}>👤</div>
                    <span>Wallet</span>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navIcon}>📊</div>
                    <span>Analytics</span>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navIcon}>👤</div>
                    <span>Personal</span>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navIcon}>✉</div>
                    <span>Message</span>
                </div>

                <div className={styles.navItem} onClick={handleLogout}>
                    <div className={styles.navIcon}>⚙</div>
                    <span>Logout</span>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <div className={styles.searchContainer}>
                        <input type="text" className={styles.searchInput} placeholder="Search..." />
                        <div className={styles.userAvatar}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.balance}`}>💳</div>
                            <div className={styles.statLabel}>Balance</div>
                        </div>
                        <div className={styles.statValue}>
                            ${balance.toFixed(2)}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.revenue}`}>🔒</div>
                            <div className={styles.statLabel}>Revenue</div>
                        </div>
                        <div className={styles.statValue}>
                            ${totalRevenue.toFixed(2)}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.expenses}`}>💳</div>
                            <div className={styles.statLabel}>Expenses</div>
                        </div>
                        <div className={styles.statValue}>
                            ${totalExpenses.toFixed(2)}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.savings}`}>💰</div>
                            <div className={styles.statLabel}>Savings</div>
                        </div>
                        <div className={styles.statValue}>
                            ${(balance * 0.1).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Chart and Recent Transactions */}
                <div className={styles.chartSection}>
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>Overview</h3>
                            <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <div style={{width: '12px', height: '12px', background: '#10b981', borderRadius: '50%'}}></div>
                                    <span style={{color: '#94a3b8', fontSize: '14px'}}>Income</span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <div style={{width: '12px', height: '12px', background: '#fbbf24', borderRadius: '50%'}}></div>
                                    <span style={{color: '#94a3b8', fontSize: '14px'}}>Expenses</span>
                                </div>
                                <select style={{background: '#334155', border: '1px solid #475569', color: 'white', padding: '4px 8px', borderRadius: '4px'}}>
                                    <option>Monthly</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.chartContainer}>
                            <div className={styles.mockChart}></div>
                            <div style={{position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold'}}>
                                ${totalRevenue.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.recentTransactions}>
                        <div className={styles.transactionsHeader}>
                            <h3 className={styles.chartTitle}>Recent Transaction</h3>
                            <a href="#" className={styles.seeAllLink}>See all</a>
                        </div>

                        {transactions.slice(0, 3).map((transaction, index) => (
                            <div key={index} className={styles.transactionItem}>
                                <div className={styles.transactionAvatar}>
                                    {transaction.recipient_name ? transaction.recipient_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                </div>
                                <div className={styles.transactionDetails}>
                                    <div className={styles.transactionName}>
                                        {transaction.recipient_name || 'Unknown'}
                                    </div>
                                    <div className={styles.transactionType}>
                                        {transaction.category && transaction.category.toLowerCase() === 'revenue' ? 'Transfers from' : 'Transfers to'}
                                    </div>
                                </div>
                                <div className={`${styles.transactionAmount} ${transaction.category && transaction.category.toLowerCase() === 'revenue' ? styles.positive : styles.negative}`}>
                                    {getAmountPrefix(transaction)}${Math.abs(transaction.amount).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transactions Table */}
                <div className={styles.transactionsSection}>
                    <div className={styles.transactionsTableHeader}>
                        <h3 className={styles.chartTitle}>Transactions</h3>
                        <div className={styles.transactionsSearch}>
                            <input type="text" className={styles.searchInput} placeholder="Search for anything..." style={{width: '200px'}} />
                            <div className={styles.dateFilter}>📅 Last 30 days</div>
                        </div>
                    </div>

                    <div className={styles.transactionsTable}>
                        <div className={styles.tableHeader}>
                            <div>Name</div>
                            <div>Date</div>
                            <div>Amount</div>
                            <div>Status</div>
                        </div>

                        {currentTransactions.map((transaction, index) => (
                            <div key={startIndex + index} className={styles.tableRow}>
                                <div className={styles.tableName}>
                                    <div className={styles.tableAvatar}>
                                        {transaction.recipient_name ? transaction.recipient_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                    </div>
                                    <span style={{color: 'white'}}>
                                        {transaction.recipient_name || 'Unknown'}
                                    </span>
                                </div>
                                <div style={{color: '#94a3b8'}}>
                                    {new Date(transaction.date).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                                <div className={`${styles.transactionAmount} ${transaction.category && transaction.category.toLowerCase() === 'revenue' ? styles.positive : styles.negative}`}>
                                    {getAmountPrefix(transaction)}${Math.abs(transaction.amount).toFixed(2)}
                                </div>
                                <div>
                                    <span className={`${styles.statusBadge} ${transaction.status === 'completed' ? styles.statusCompleted : styles.statusPending}`}>
                                        {transaction.status || 'Completed'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {transactions.length === 0 && (
                            <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                                No transactions found
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {transactions.length > transactionsPerPage && (
                        <div className={styles.paginationContainer}>
                            <div className={styles.paginationInfo}>
                                Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    ← Previous
                                </button>
                                <span className={styles.pageInfo}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
