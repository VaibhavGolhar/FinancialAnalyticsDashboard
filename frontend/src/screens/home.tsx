import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';
import OverviewChart from './OverviewChart';

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const transactionsPerPage = 10;
    const [chartView, setChartView] = useState<'Yearly' | 'Monthly'>('Yearly');
    const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
    const [sortOption, setSortOption] = useState('date-desc');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
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

    // Sorting logic
    const sortTransactions = (txs: any[]) => {
        const sorted = [...txs];
        switch (sortOption) {
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                break;
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                break;
            case 'user-asc':
                sorted.sort((a, b) => (a.user_id || '').localeCompare(b.user_id || ''));
                break;
            case 'user-desc':
                sorted.sort((a, b) => (b.user_id || '').localeCompare(a.user_id || ''));
                break;
            case 'amount-asc':
                sorted.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                sorted.sort((a, b) => b.amount - a.amount);
                break;
            default:
                break;
        }
        return sorted;
    };

    // Filtering logic
    const filterTransactions = (txs: any[]) => {
        return txs.filter(t => {
            const categoryMatch = filterCategory === 'all' || (t.category && t.category.toLowerCase() === filterCategory);
            const statusMatch = filterStatus === 'all' || (t.status && t.status.toLowerCase() === filterStatus);
            return categoryMatch && statusMatch;
        });
    };

    // Searching logic
    const searchTransactions = (txs: any[]) => {
        if (!searchTerm.trim()) return txs;
        const lower = searchTerm.toLowerCase();
        return txs.filter(t => {
            // Match user_id
            if (t.user_id && t.user_id.toLowerCase().includes(lower)) return true;
            // Match amount (exact or partial)
            if (t.amount && t.amount.toString().includes(lower)) return true;
            // Match date (any format)
            if (t.date && new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(lower)) return true;
            if (t.date && t.date.toLowerCase().includes(lower)) return true;
            return false;
        });
    };

    // Apply searching, then filtering, then sorting, then pagination
    const searchedTransactions = searchTransactions(transactions);
    const filteredTransactions = filterTransactions(searchedTransactions);
    const sortedTransactions = sortTransactions(filteredTransactions);
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

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

    // Updated calculations using category (case-insensitive)
    const balance = transactions.reduce((total, t) => total + getSignedAmount(t), 0);
    const totalRevenue = transactions.filter(t => t.category && t.category.toLowerCase() === 'revenue').reduce((total, t) => total + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.category && t.category.toLowerCase() === 'expense').reduce((total, t) => total + Math.abs(t.amount), 0);

    // Extract all unique month-year keys from transactions for dropdown
    const monthYearOptions = Array.from(new Set(transactions.map(t => {
        const date = new Date(t.date);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${month} ${year}`;
    })));
    monthYearOptions.sort((a, b) => {
        const [ma, ya] = a.split(' ');
        const [mb, yb] = b.split(' ');
        const da = new Date(`${ma} 1, ${ya}`);
        const db = new Date(`${mb} 1, ${yb}`);
        return da.getTime() - db.getTime();
    });
    // Set default selected month to latest if not set
    React.useEffect(() => {
        if (chartView === 'Monthly' && !selectedMonthYear && monthYearOptions.length > 0) {
            setSelectedMonthYear(monthYearOptions[monthYearOptions.length - 1]);
        }
    }, [chartView, monthYearOptions, selectedMonthYear]);

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
                    <div className={styles.navIcon}>📊</div>
                    <span>Report</span>
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
                        <div className={styles.userAvatar}>
                            {'A'}
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
                                <select
                                    style={{background: '#334155', border: '1px solid #475569', color: 'white', padding: '4px 8px', borderRadius: '4px'}}
                                    value={chartView}
                                    onChange={e => setChartView(e.target.value as 'Yearly' | 'Monthly')}
                                >
                                    <option value="Yearly">Yearly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.chartContainer}>
                            <OverviewChart
                                transactions={transactions}
                                view={chartView}
                                selectedMonthYear={chartView === 'Monthly' ? selectedMonthYear : undefined}
                                monthYearOptions={monthYearOptions}
                                onMonthYearChange={setSelectedMonthYear}
                            />
                        </div>
                    </div>

                    <div className={styles.recentTransactions}>
                        <div className={styles.transactionsHeader}>
                            <h3 className={styles.chartTitle}>Recent Transactions</h3>
                        </div>

                        {transactions.slice(0, 3).map((transaction, index) => (
                            <div key={index} className={styles.transactionItem}>
                                <div className={styles.transactionAvatar}>
                                    {transaction.user_id ? parseInt(transaction.user_id.split('_')[1], 10) : 'U'}
                                </div>
                                <div className={styles.transactionDetails}>
                                    <div className={styles.transactionName}>
                                        {transaction.user_id || 'Unknown'}
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
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search for anything..."
                                style={{width: '200px'}}
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div style={{marginLeft: '16px', display: 'flex', gap: '8px', alignItems: 'center'}}>
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{background: '#334155', color: 'white', border: '1px solid #475569', borderRadius: 4, padding: '4px 8px'}}>
                                <option value="all">All Categories</option>
                                <option value="expense">Expense</option>
                                <option value="revenue">Revenue</option>
                            </select>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{background: '#334155', color: 'white', border: '1px solid #475569', borderRadius: 4, padding: '4px 8px'}}>
                                <option value="all">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                            <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{background: '#334155', color: 'white', border: '1px solid #475569', borderRadius: 4, padding: '4px 8px'}}>
                                <option value="date-desc">Date (Newest first)</option>
                                <option value="date-asc">Date (Oldest first)</option>
                                <option value="user-asc">User ID (Ascending)</option>
                                <option value="user-desc">User ID (Descending)</option>
                                <option value="amount-asc">Amount (Ascending)</option>
                                <option value="amount-desc">Amount (Descending)</option>
                            </select>
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
                                        {transaction.user_id ? parseInt(transaction.user_id.split('_')[1], 10) : 'U'}
                                    </div>
                                    <span style={{color: 'white'}}>
                                        {transaction.user_id || 'Unknown'}
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
                                    <span className={
                                        `${styles.statusBadge} ` +
                                        (transaction.status && transaction.status.toLowerCase() === 'pending'
                                            ? styles.statusPending
                                            : styles.statusCompleted)
                                    }>
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
                    {filteredTransactions.length > transactionsPerPage && (
                        <div className={styles.paginationContainer}>
                            <div className={styles.paginationInfo}>
                                Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
