import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';
import OverviewChart from './OverviewChart';

// Modal for report generation
const ReportModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
    type ColumnKey = 'date' | 'amount' | 'category' | 'status' | 'user_id';
    const allColumns: { key: ColumnKey; label: string }[] = [
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'user_id', label: 'User ID' },
    ];
    // State for selected and unselected columns
    const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(allColumns.map(c => c.key));
    const [unselectedColumns, setUnselectedColumns] = useState<ColumnKey[]>([]);
    const [loading, setLoading] = useState(false);
    // Filter and sort state (reuse from main table)
    const [sortOption, setSortOption] = useState('date-desc');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggingIndex(index);
    };
    const handleDragOver = (index: number) => {
        if (draggingIndex === null || draggingIndex === index) return;
        const newOrder = [...selectedColumns];
        const [removed] = newOrder.splice(draggingIndex, 1);
        newOrder.splice(index, 0, removed);
        setSelectedColumns(newOrder);
        setDraggingIndex(index);
    };
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const handleDragEnd = () => {
        setDraggingIndex(null);
    };
    // Remove column from selected
    const handleRemoveColumn = (col: ColumnKey) => {
        setSelectedColumns(cols => cols.filter(c => c !== col));
        setUnselectedColumns(cols => [...cols, col]);
    };
    // Add column from unselected
    const handleAddColumn = (col: ColumnKey) => {
        setUnselectedColumns(cols => cols.filter(c => c !== col));
        setSelectedColumns(cols => [...cols, col]);
    };
    // Generate report
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const res = await fetch(`${apiBaseUrl}/api/get-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    columns: selectedColumns,
                    sort: sortOption,
                    filterCategory,
                    filterStatus
                }),
            });
            if (!res.ok) throw new Error('Failed to generate report');
            const blob = await res.blob();
            // Download as CSV
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions_report.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            onClose();
        } catch (e) {
            alert('Failed to generate report.');
            console.log(e);
        } finally {
            setLoading(false);
        }
    };
    // Reset columns when modal opens
    React.useEffect(() => {
        if (open) {
            setSelectedColumns(allColumns.map(c => c.key));
            setUnselectedColumns([]);
            setSortOption('date-desc');
            setFilterCategory('all');
            setFilterStatus('all');
        }
    }, [open]);
    if (!open) return null;
    return (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#1e293b',padding:32,borderRadius:12,minWidth:520,color:'#fff',boxShadow:'0 2px 16px #0008',display:'flex',flexDirection:'column',gap:16}}>
        <h2 style={{marginBottom:8}}>Generate Report</h2>
        <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
          {/* Selected columns (horizontal, draggable) */}
          <div style={{flex:1}}>
            <div style={{marginBottom:8,fontWeight:600}}>Selected Columns (drag to reorder):</div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
              {selectedColumns.map((col, idx) => {
                const colLabel = allColumns.find(c => c.key === col)?.label || col;
                return (
                  <div
                    key={col}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
                    onDragEnd={handleDragEnd}
                    style={{
                      background:'#334155',
                      padding:'8px 16px',
                      borderRadius:6,
                      cursor:'grab',
                      opacity: draggingIndex === idx ? 0.5 : 1,
                      border: '2px solid #64748b',
                      display:'flex',
                      alignItems:'center',
                      gap:6
                    }}
                  >
                    {colLabel}
                    {selectedColumns.length > 1 && (
                      <span style={{marginLeft:4,cursor:'pointer',color:'#f87171'}} onClick={() => handleRemoveColumn(col)} title="Remove">✕</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Unselected columns (vertical) */}
          <div style={{minWidth:120}}>
            <div style={{marginBottom:8,fontWeight:600}}>Unselected</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {unselectedColumns.length === 0 && <div style={{color:'#64748b',fontSize:13}}>None</div>}
              {unselectedColumns.map(col => {
                const colLabel = allColumns.find(c => c.key === col)?.label || col;
                return (
                  <div
                    key={col}
                    style={{background:'#334155',padding:'8px 12px',borderRadius:6,cursor:'pointer',border:'2px solid #64748b'}}
                    onClick={() => handleAddColumn(col)}
                    title="Add column"
                  >
                    {colLabel}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Filter and sort options (reuse from main table) */}
        <div style={{display:'flex',gap:16,margin:'16px 0'}}>
          <div>
            <div style={{fontWeight:600,marginBottom:4}}>Sort By</div>
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{padding:6,borderRadius:4}}>
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High-Low)</option>
              <option value="amount-asc">Amount (Low-High)</option>
              <option value="user-asc">User (A-Z)</option>
              <option value="user-desc">User (Z-A)</option>
            </select>
          </div>
          <div>
            <div style={{fontWeight:600,marginBottom:4}}>Category</div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{padding:6,borderRadius:4}}>
              <option value="all">All</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <div style={{fontWeight:600,marginBottom:4}}>Status</div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{padding:6,borderRadius:4}}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginTop:8}}>
          <button onClick={handleGenerate} disabled={loading} style={{background:'#10b981',color:'#fff',padding:'8px 20px',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer',marginRight:8}}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button onClick={onClose} style={{background:'#334155',color:'#fff',padding:'8px 20px',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// Transaction CRUD Modal
const TransactionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}> = ({ open, onClose, onSave, initialData }) => {
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || 'Revenue');
  const [status, setStatus] = useState(initialData?.status || 'Paid');
  const [userId, setUserId] = useState(initialData?.user_id || '');
  const [error, setError] = useState('');
  useEffect(() => {
    setAmount(initialData?.amount || '');
    setCategory(initialData?.category || 'Revenue');
    setStatus(initialData?.status || 'Paid');
    setUserId(initialData?.user_id || '');
    setError('');
  }, [open, initialData]);
  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a number above 0');
      return;
    }
    if (!userId) {
      setError('User ID is required');
      return;
    }
    onSave({ amount: Number(amount), category, status, user_id: userId });
  };
  if (!open) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{initialData ? 'Edit' : 'Add'} Transaction</h2>
        <input
          className={styles.userInput}
          type="number"
          min="1"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <select className={styles.userInput} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="Revenue">Revenue</option>
          <option value="Expense">Expense</option>
        </select>
        <select className={styles.userInput} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <input
          className={styles.userInput}
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={e => setUserId(e.target.value)}
        />
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className={styles.nextButton} onClick={handleSubmit}>{initialData ? 'Update' : 'Add'}</button>
          <button className={styles.textButton} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
    interface Transaction {
        id: number;
        date: string;
        amount: number;
        category: 'Revenue' | 'Expense' | string;
        status: 'Paid' | 'Pending' | 'Failed' | string;
        user_id: string;
        user_profile: string;
    }

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const transactionsPerPage = 10;
    const [chartView, setChartView] = useState<'Yearly' | 'Monthly'>('Yearly');
    const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
    const [sortOption, setSortOption] = useState('date-desc');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string|null>(null);
    const [error, setError] = useState('');
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
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
                const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
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
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
                const response = await fetch(`${apiBaseUrl}/api/get-transactions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Sort transactions by date (most recent first)
                    const sortedTransactions = (data.data || []).sort((a: Transaction, b: Transaction) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setTransactions(sortedTransactions);
                } else {
                    setTransactions([]);
                }
            } catch (error) {
                setTransactions([]);
                console.log(error);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Sorting logic
    const sortTransactions = (txs: Transaction[]) => {
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
    const filterTransactions = (txs: Transaction[]) => {
        return txs.filter(t => {
            const categoryMatch = filterCategory === 'all' || (t.category && t.category.toLowerCase() === filterCategory);
            const statusMatch = filterStatus === 'all' || (t.status && t.status.toLowerCase() === filterStatus);
            const dateMatch = (!fromDate || new Date(t.date) >= new Date(fromDate)) && (!toDate || new Date(t.date) <= new Date(toDate));
            return categoryMatch && statusMatch && dateMatch;
        });
    };

    // Searching logic
    const searchTransactions = (txs: Transaction[]) => {
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
    /*const getSignedAmount = (transaction: any) => {
        // Defensive: treat missing/invalid category as expense
        if (transaction.category && transaction.category.toLowerCase() === 'revenue') return Math.abs(transaction.amount);
        if (transaction.category && transaction.category.toLowerCase() === 'expense') return -Math.abs(transaction.amount);
        return -Math.abs(transaction.amount); // fallback: treat as expense
    };*/
    const getAmountPrefix = (transaction: Transaction) => {
        if (transaction.category && transaction.category.toLowerCase() === 'revenue') return '+';
        if (transaction.category && transaction.category.toLowerCase() === 'expense') return '-';
        return '-'; // fallback: treat as expense
    };

    // Updated calculations using category (case-insensitive)
    // BALANCE: only paid revenues - only paid expenses
    const balance = transactions.reduce((total, t) => {
        if (!t.status || t.status.toLowerCase() !== 'paid') return total;
        if (t.category && t.category.toLowerCase() === 'revenue') return total + Math.abs(t.amount);
        if (t.category && t.category.toLowerCase() === 'expense') return total - Math.abs(t.amount);
        return total;
    }, 0);
    // SAVINGS: all revenue - all expenses (regardless of status)
    const totalRevenue = transactions.filter(t => t.category && t.category.toLowerCase() === 'revenue').reduce((total, t) => total + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.category && t.category.toLowerCase() === 'expense').reduce((total, t) => total + Math.abs(t.amount), 0);
    const savings = totalRevenue - totalExpenses;

    // Revenue/Expense breakdowns
    const paidRevenue = transactions.filter(t => t.category && t.category.toLowerCase() === 'revenue' && t.status && t.status.toLowerCase() === 'paid').reduce((total, t) => total + Math.abs(t.amount), 0);
    const pendingRevenue = transactions.filter(t => t.category && t.category.toLowerCase() === 'revenue' && t.status && t.status.toLowerCase() === 'pending').reduce((total, t) => total + Math.abs(t.amount), 0);
    const paidExpenses = transactions.filter(t => t.category && t.category.toLowerCase() === 'expense' && t.status && t.status.toLowerCase() === 'paid').reduce((total, t) => total + Math.abs(t.amount), 0);
    const pendingExpenses = transactions.filter(t => t.category && t.category.toLowerCase() === 'expense' && t.status && t.status.toLowerCase() === 'pending').reduce((total, t) => total + Math.abs(t.amount), 0);

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

    // Fetch transactions
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const res = await fetch(`${apiBaseUrl}/api/get-transactions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setTransactions(data.data);
            else setError('Failed to fetch transactions');
        } catch {
            setError('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    // Add or update transaction
    const handleSave = async (form: any) => {
        setError('');
        const token = localStorage.getItem('token');
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        try {
          let res;
          if (editData) {
            res = await fetch(`${apiBaseUrl}/api/${editData._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(form),
            });
          } else {
            // Add transaction: call backend with correct format
            res = await fetch(`${apiBaseUrl}/api/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(form),
            });
          }
          const data = await res.json();
          if (data.success) {
            setShowModal(false);
            setEditData(null);
            fetchTransactions();
          } else {
            setError(data.message || 'Failed to save transaction');
          }
        } catch {
          setError('Failed to save transaction');
        }
      };

    // Delete transaction
    const handleDelete = async (id: string) => {
        setError('');
        const token = localStorage.getItem('token');
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        try {
            const res = await fetch(`${apiBaseUrl}/api/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) fetchTransactions();
            else setError(data.message || 'Failed to delete transaction');
        } catch {
            setError('Failed to delete transaction');
        }
        setDeleteId(null);
    };

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

                <div className={styles.navItem} onClick={() => setReportModalOpen(true)}>
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
                {/* Report Modal */}
                <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} />

                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.pageTitle}>Dashboard</h2>
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
                            <div className={styles.statLabel}>Current Balance</div>
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
                            <div style={{fontSize:'13px',color:'#94a3b8',marginTop:2}}>
                                Paid: <span style={{color:'#10b981'}}>${paidRevenue.toFixed(2)}</span> &nbsp;|
                                Pending: <span style={{color:'#fbbf24'}}>${pendingRevenue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.expenses}`}>💳</div>
                            <div className={styles.statLabel}>Expenses</div>
                        </div>
                        <div className={styles.statValue}>
                            ${totalExpenses.toFixed(2)}
                            <div style={{fontSize:'13px',color:'#94a3b8',marginTop:2}}>
                                Paid: <span style={{color:'#10b981'}}>${paidExpenses.toFixed(2)}</span> &nbsp;|
                                Pending: <span style={{color:'#fbbf24'}}>${pendingExpenses.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles.savings}`}>💰</div>
                            <div className={styles.statLabel}>Estimated Savings</div>
                        </div>
                        <div className={styles.statValue}>
                            ${savings.toFixed(2)}
                            <div style={{fontSize:'13px',color:'#94a3b8',marginTop:2}}>Includes pending payments</div>
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
                        <button className={styles.nextButton} style={{marginLeft: 16}} onClick={() => { setShowModal(true); setEditData(null); }}>
                            + Add Transaction
                        </button>
                        <div style={{display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: '8px'}}>
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
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={fromDate}
                                onChange={e => {
                                    setFromDate(e.target.value);
                                    setCurrentPage(1);
                                }}></input>
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={toDate}
                                onChange={e => {
                                    setToDate(e.target.value);
                                    setCurrentPage(1);
                                }}>
                            </input>
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
                            <div style={{textAlign: 'left'}}>Name</div>
                            <div>Date</div>
                            <div>Amount</div>
                            <div>Status</div>
                            <div>Actions</div> {/* New column for actions */}
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
                                <div style={{display: 'flex', gap: 8}}>
                                    <button
                                        className={styles.textButton}
                                        title="Edit"
                                        onClick={() => { setEditData(transaction); setShowModal(true); }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.textButton}
                                        title="Delete"
                                        onClick={() => setDeleteId(transaction.id)}
                                        style={{color: '#f87171'}}
                                    >
                                        Delete
                                    </button>
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

                {/* Transaction CRUD Modal */}
                <TransactionModal
                    open={showModal}
                    onClose={() => { setShowModal(false); setEditData(null); }}
                    onSave={handleSave}
                    initialData={editData}
                />
                {deleteId && (
                    <div className={styles.modalOverlay}>
                      <div className={styles.modalContent}>
                        <h3>Are you sure you want to delete this transaction?</h3>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button className={styles.nextButton} onClick={() => handleDelete(deleteId)}>Delete</button>
                          <button className={styles.textButton} onClick={() => setDeleteId(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
        </div>
    );
};

export default Home;
