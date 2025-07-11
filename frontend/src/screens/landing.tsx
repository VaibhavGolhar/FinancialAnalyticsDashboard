import React, { useState } from 'react';
import { Receipt, DollarSign, CreditCard, Building2 } from 'lucide-react';
import styles from './landing.module.css';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [registerUserId, setRegisterUserId] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirm, setRegisterConfirm] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState('');
    const navigate = useNavigate();

    const handleNextClick = () => {
        if (!userId.trim()) {
            setError('Please enter your User ID');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleLoginClick = async () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                // Redirect to home page
                navigate('/home');
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
                // Reset to step 1 if authentication fails
                setStep(1);
                setPassword('');
            }
        } catch (err) {
            setError('Network error. Please try again later.');
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setRegisterError('');
        setRegisterSuccess('');
        if (!registerUserId.trim() || !registerPassword.trim() || !registerConfirm.trim()) {
            setRegisterError('All fields are required.');
            return;
        }
        if (registerPassword !== registerConfirm) {
            setRegisterError('Passwords do not match.');
            return;
        }
        setRegisterLoading(true);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: registerUserId, password: registerPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setRegisterSuccess('Account created! You can now log in.');
                setTimeout(() => setShowRegister(false), 1200);
            } else {
                setRegisterError(data.message || 'Password should be at least 8 characters long and\ncontain at least one uppercase letter, one lowercase letter,\none number, and one special character.');
            }
        } catch (err) {
            setRegisterError('Network error. Please try again.');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarContent}>
                    <h1 className={styles.logo}>FinSight</h1>

                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            required
                            placeholder=""
                            className={styles.userInput}
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={step === 2}
                        />
                        <label htmlFor="userId" className={styles.floatingLabel}>
                            User ID
                        </label>
                    </div>

                    {step === 2 && (
                        <div className={`${styles.inputContainer} ${styles.slideIn}`}>
                            <input
                                type="password"
                                required
                                placeholder=""
                                className={styles.userInput}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                            <label htmlFor="password" className={styles.floatingLabel}>
                                Password
                            </label>
                        </div>
                    )}

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.buttonContainer}>
                        {step === 1 ? (
                            <button 
                                className={styles.nextButton} 
                                onClick={handleNextClick}
                            >
                                Next
                            </button>
                        ) : (
                            <button 
                                className={styles.nextButton} 
                                onClick={handleLoginClick}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.registerLink}>
                    <span>Don't have an account? </span>
                    <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setShowRegister(true)}
                    >
                        Create here.
                    </button>
                </div>
                <div className={styles.bottomBar}>
                    <div className={styles.curatedBy}>
                        <span>created by</span>
                        <div className={styles.logoContainer}>
                            <span className={styles.createdText}>Vaibhav Golhar</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.headline}>
                        The expense tracking app<br />
                        that does it all, for everyone.
                    </h2>

                    {/* Feature Icons Grid */}
                    <div className={styles.grid}>
                        <div className={styles.feature}>
                            <div className={styles.iconContainer}>
                                <Receipt size={32} color="white" />
                            </div>
                            <div className={styles.featureText}>
                                <div className={styles.featureTitle}>Track</div>
                                <div className={styles.featureSubtitle}>transactions</div>
                            </div>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.iconContainer}>
                                <DollarSign size={32} color="white" />
                            </div>
                            <div className={styles.featureText}>
                                <div className={styles.featureTitle}>Manage</div>
                                <div className={styles.featureSubtitle}>expenses</div>
                            </div>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.iconContainer}>
                                <CreditCard size={32} color="white" />
                            </div>
                            <div className={styles.featureText}>
                                <div className={styles.featureTitle}>Visualize</div>
                                <div className={styles.featureSubtitle}>trends</div>
                            </div>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.iconContainer}>
                                <Building2 size={32} color="white" />
                            </div>
                            <div className={styles.featureText}>
                                <div className={styles.featureTitle}>Create</div>
                                <div className={styles.featureSubtitle}>reports</div>
                            </div>
                        </div>
                    </div>

                    <p className={styles.tagline}>
                        Save yourself time and money.
                    </p>
                </div>

                {/* Bottom Bar */}

            </div>

            {showRegister && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Create Account</h2>
                        <input
                            className={styles.userInput}
                            type="text"
                            placeholder="Username"
                            value={registerUserId}
                            onChange={e => setRegisterUserId(e.target.value)}
                        />
                        <input
                            className={styles.userInput}
                            type="password"
                            placeholder="Password"
                            value={registerPassword}
                            onChange={e => setRegisterPassword(e.target.value)}
                        />
                        <input
                            className={styles.userInput}
                            type="password"
                            placeholder="Confirm Password"
                            value={registerConfirm}
                            onChange={e => setRegisterConfirm(e.target.value)}
                        />
                        {registerError && <div className={styles.errorMessage}>{registerError}</div>}
                        {registerSuccess && <div className={styles.successMessage}>{registerSuccess}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                className={styles.nextButton}
                                onClick={handleRegister}
                                disabled={registerLoading}
                            >
                                {registerLoading ? 'Registering...' : 'Register'}
                            </button>
                            <button
                                className={styles.textButton}
                                onClick={() => setShowRegister(false)}
                                disabled={registerLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;
