import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PixelBlast from './ui/PixelBlast';
// 1. Import GlassSurface
import GlassSurface from './ui/LiquidGlass';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful! Redirecting to login...');
                setMessageType('success');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                if (data.username) setMessage(`Error: ${data.username[0]}`);
                else if (data.password) setMessage(`Error: ${data.password[0]}`);
                else setMessage('Registration failed. Please try again.');
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
            position: 'relative',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
            backgroundColor: '#050a14'
        }}>
            
            {/* --- PAGE BACKGROUND (PixelBlast) --- */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <PixelBlast 
                    variant="diamond"
                    color="#cd001e"
                    pixelSize={4}
                    patternScale={6}
                    speed={0.5}
                    edgeFade={0.1}
                    noiseAmount={0}
                    transparent={true}
                    enableRipples={true}
                    rippleIntensityScale={4.0}
                    rippleSpeed={0.4}
                    rippleThickness={0.15}
                    liquid={true}
                    liquidStrength={0.00}
                    liquidRadius={0.15}
                />
            </div>

            {/* --- LAYOUT CONTAINER --- */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                pointerEvents: 'none' // Click-through to background
            }}>

                {/* --- CARD WRAPPER --- */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '420px',
                    borderRadius: '30px',
                    overflow: 'hidden', // Clips the glass canvas
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none', // Re-enable clicks for form
                    transform: 'translateZ(0)'
                }}>

                    {/* --- LAYER A: GLASS SURFACE (Background) --- */}
                    <GlassSurface 
                        width="100%"
                        height="100%" 
                        displace={4}
                        distortionScale={-150} 
                        redOffset={5}
                        greenOffset={15}
                        blueOffset={15}
                        brightness={70}
                        opacity={0.6}
                        mixBlendMode="normal"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0,
                        }}
                    />

                    {/* --- LAYER B: FORM CONTENT (Foreground) --- */}
                    <div className="fade-in-up" style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '3rem',
                        background: 'rgba(20, 30, 50, 0.2)',
                    }}>
                        
                        <style>{`
                            /* Input Styles */
                            .apple-input {
                                background: rgba(0, 0, 0, 0.2);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 14px;
                                color: white;
                                width: 100%;
                                padding: 16px;
                                font-size: 15px;
                                transition: all 0.2s ease;
                                outline: none;
                                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                                box-sizing: border-box;
                            }
                            .apple-input:focus {
                                background: rgba(0, 0, 0, 0.4);
                                border-color: rgba(205, 0, 30, 0.5);
                                box-shadow: 0 0 0 4px rgba(205, 0, 30, 0.15);
                            }
                            
                            /* Button Styles */
                            .apple-button {
                                background: linear-gradient(135deg, #cd001e 0%, #ff4b5c 100%);
                                border: none;
                                border-radius: 14px;
                                color: white;
                                font-weight: 600;
                                padding: 16px;
                                width: 100%;
                                cursor: pointer;
                                font-size: 16px;
                                box-shadow: 0 4px 15px rgba(205, 0, 30, 0.4);
                                transition: transform 0.1s ease, box-shadow 0.2s ease;
                            }
                            .apple-button:hover:not(:disabled) {
                                // transform: translateY(-1px);
                                box-shadow: 0 8px 25px rgba(205, 0, 30, 0.5);
                            }
                            .apple-button:active:not(:disabled) { transform: scale(0.98); }
                            .apple-button:disabled { opacity: 0.6; cursor: not-allowed; }

                            /* Animations */
                            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                            .fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        `}</style>

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ 
                                width: '64px', height: '64px', margin: '0 auto 1.5rem auto',
                                background: '#ff162dff', backdropFilter: 'blur(10px)',
                                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                            }}>
                                <img src="/logo_S_white.png" alt="Icon" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Create Account</h1>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Join us to explore the data</p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div style={{
                                marginBottom: '1.5rem', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: messageType === 'success' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)',
                                color: '#fff',
                                border: messageType === 'success' ? '1px solid rgba(52, 199, 89, 0.4)' : '1px solid rgba(255, 59, 48, 0.4)',
                                backdropFilter: 'blur(5px)'
                            }}>
                                <span>{messageType === 'success' ? '✓' : '⚠'}</span>
                                {message}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', marginLeft: '4px' }}>
                                    Username
                                </label>
                                <input
                                    className="apple-input"
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    placeholder="Choose a username"
                                    style={{pointerEvents: isLoading ? 'none' : 'auto'}} 
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', marginLeft: '4px' }}>
                                    Password
                                </label>
                                <input
                                    className="apple-input"
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    placeholder="Minimum 6 characters"
                                    style={{pointerEvents: isLoading ? 'none' : 'auto'}}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', marginLeft: '4px' }}>
                                    Confirm Password
                                </label>
                                <input
                                    className="apple-input"
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    placeholder="Re-enter your password"
                                    style={{pointerEvents: isLoading ? 'none' : 'auto'}}
                                />
                            </div>

                            <button type="submit" 
                                    className="apple-button" 
                                    disabled={isLoading} 
                                    style={{pointerEvents: isLoading?"none":"auto"}}>
                                {isLoading ? (
                                    <><span style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                                ) : "Create Account"}
                            </button>
                        </form>

                        {/* Footer */}
                        <div style={{ marginTop: '2rem', textAlign: 'center', pointerEvents: isLoading?"none":"auto" }}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: '#ff4b5c', textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s' }}>
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;