import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match!');
            setMessageType('error');
            return;
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long!');
            setMessageType('error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful! Redirecting to login...');
                setMessageType('success');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                if (data.username) {
                    setMessage(`Error: ${data.username[0]}`);
                } else if (data.password) {
                    setMessage(`Error: ${data.password[0]}`);
                } else {
                    setMessage('Registration failed. Please try again.');
                }
                setMessageType('error');
            }
        } catch (error) {
            console.error('Network error:', error);
            setMessage('Server is down or unreachable');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a1428 0%, #142350 50%, #0a1428 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: "'Montserrat', sans-serif"
        }}>
            {/* Animated Background Circles */}
            <div style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-160px',
                    right: '-160px',
                    width: '320px',
                    height: '320px',
                    background: 'radial-gradient(circle, rgba(205, 0, 30, 0.1) 0%, rgba(205, 0, 30, 0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(64px)',
                    animation: 'spin-slow 20s linear infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-160px',
                    left: '-160px',
                    width: '320px',
                    height: '320px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(64px)',
                    animation: 'spin-slow-reverse 25s linear infinite'
                }} />
            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-slow-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                .fade-in-up-delay-1 { animation-delay: 0.1s; }
                .fade-in-up-delay-2 { animation-delay: 0.2s; }
                .fade-in-up-delay-3 { animation-delay: 0.3s; }
                .fade-in-up-delay-4 { animation-delay: 0.4s; }
                .fade-in-up-delay-5 { animation-delay: 0.5s; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Card Container */}
                <div style={{
                    backdropFilter: 'blur(16px)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    padding: '2rem',
                    marginBottom: '1.5rem'
                }} className="fade-in-up">
                    {/* Logo/Title */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="fade-in-up-delay-1">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 10px 25px rgba(205, 0, 30, 0.4)',
                                fontSize: '24px'
                            }}>
                                {/* LOGO */}
                                <img src="/logo_S_white.png" 
                                    alt="Icon"
                                    style={{
                                        maxWidth: '70%',
                                        maxHeight: '80%',
                                        objectFit: 'fill'
                                    }} />
                            </div>
                        </div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: 'white',
                            marginBottom: '0.5rem'
                        }}>Create Account</h1>
                        <p style={{
                            color: '#adb5bd',
                            fontSize: '14px'
                        }}>Sign up to get started</p>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: messageType === 'success' 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : 'rgba(239, 68, 68, 0.15)',
                            color: messageType === 'success' 
                                ? '#86efac' 
                                : '#fca5a5',
                            border: messageType === 'success'
                                ? '1px solid rgba(16, 185, 129, 0.5)'
                                : '1px solid rgba(239, 68, 68, 0.5)'
                        }} className="fade-in-up-delay-2">
                            <span style={{ fontSize: '18px' }}>
                                {messageType === 'success' ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleRegister} style={{ marginBottom: '1.5rem' }}>
                        {/* Username Field */}
                        <div style={{ marginBottom: '1rem' }} className="fade-in-up-delay-2">
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#d1d5db',
                                marginBottom: '0.5rem'
                            }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="Choose a username"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(205, 0, 30, 0.5)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                            />
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '1rem' }} className="fade-in-up-delay-3">
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#d1d5db',
                                marginBottom: '0.5rem'
                            }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="Minimum 6 characters"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(205, 0, 30, 0.5)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div style={{ marginBottom: '1.5rem' }} className="fade-in-up-delay-3">
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#d1d5db',
                                marginBottom: '0.5rem'
                            }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="Confirm your password"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(205, 0, 30, 0.5)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: isLoading
                                    ? 'rgba(107, 114, 128, 0.5)'
                                    : 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isLoading
                                    ? 'none'
                                    : '0 10px 25px rgba(205, 0, 30, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 15px 35px rgba(205, 0, 30, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(205, 0, 30, 0.3)';
                                }
                            }}
                            className="fade-in-up-delay-4"
                        >
                            {isLoading ? (
                                <>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        borderTop: '2px solid white',
                                        borderRight: '2px solid white',
                                        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                                        borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
                                        animation: 'spin 0.8s linear infinite'
                                    }} />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        position: 'relative',
                        margin: '1.5rem 0',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.1)'
                        }} />
                        <span style={{
                            padding: '0 12px',
                            color: '#6b7280',
                            fontSize: '12px'
                        }}>Have an account?</span>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.1)'
                        }} />
                    </div>

                    {/* Login Link */}
                    <p style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '13px',
                        marginBottom: 0
                    }} className="fade-in-up-delay-5">
                        Already registered?{' '}
                        <Link
                            to="/login"
                            style={{
                                color: '#f87171',
                                textDecoration: 'none',
                                fontWeight: 600,
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#fca5a5'}
                            onMouseLeave={(e) => e.target.style.color = '#f87171'}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer Text */}
                <p style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '11px'
                }} className="fade-in-up-delay-5">
                    {/* Make sure the backend server is running on http://127.0.0.1:8000 */}
                </p>
            </div>
        </div>
    );
};

export default Register;