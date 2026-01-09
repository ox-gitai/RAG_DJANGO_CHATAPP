import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from './Store';
import PixelBlast from './ui/PixelBlast';
import GlassSurface from './ui/LiquidGlass'; 
import JSEncrypt from 'jsencrypt';


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [publicKey, setPublicKey] = useState('');
    const { setIsLogin } = useStore();
    const navigate = useNavigate();


    // fetch public key on mount
    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/auth/public-key/')
            .then(res => res.json())
            .then(data => {
                // Ensure your backend returns { "public_key": "-----BEGIN PUBLIC KEY..." }
                setPublicKey(data.public_key);
                console.log("RSA Public Key loaded.");
            })
            .catch(err => console.error("Failed to load public key:", err));
    }, []);


    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        setIsLoading(true);

        try {
            let payloadPassword = password;

            // 2. ENCRYPT THE PASSWORD
            if (publicKey) {
                const encryptor = new JSEncrypt();
                encryptor.setPublicKey(publicKey);
                const encrypted = encryptor.encrypt(password);
                
                if (!encrypted) {
                    console.error("Encryption failed");
                    setMessage("Security Error: Could not encrypt.");
                    setIsLoading(false);
                    return;
                }
                payloadPassword = encrypted; // Use the encrypted string
            } else {
                console.warn("No public key found! Sending plaintext (Insecure).");
            }

            // 3. SEND THE ENCRYPTED PAYLOAD
            const response = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: username, 
                    password: payloadPassword // <--- SEND ENCRYPTED VERSION
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                setIsLogin(true);
                navigate('/conversation');
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('Server error.');
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
                pointerEvents: 'none' // Allows clicking through empty space
            }}>

                {/* --- 2. CARD WRAPPER --- */}
                {/* This div defines the shape (rounded corners) and holds both the glass and the form */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '420px',
                    borderRadius: '30px', // Rounding the card
                    overflow: 'hidden',   // Clips the square GlassSurface to the rounded corners
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Deep shadow
                    border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
                    pointerEvents: 'none', // Re-enable clicking for the form
                    transform: 'translateZ(0)' // Fix for Safari overflow clipping
                }}>

                    {/* --- LAYER A: GLASS SURFACE (Background) --- */}
                    <GlassSurface 
                        width="100%"
                        height="100%" 
                        // High distortion settings for "Liquid" look
                        displace={3}
                        distortionScale={-150} 
                        redOffset={5}
                        greenOffset={15}
                        blueOffset={15}
                        brightness={70} // Slightly brighter to act as a card background
                        opacity={0.6}   // Semi-transparent
                        mixBlendMode="normal"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0, // Behind the content
                        }}
                    />

                    {/* --- LAYER B: FORM CONTENT (Foreground) --- */}
                    <div className="fade-in-up" style={{
                        position: 'relative',
                        zIndex: 1, // On top of the glass
                        padding: '3rem',
                        background: 'rgba(20, 30, 50, 0.2)', // Slight tint to improve text readability
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
                                box-sizing: border-box; /* Important for width: 100% */
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
                                <img src="/logo_S_white.png" alt="Icon" style={{ width: '60%', height: '60%', objectFit: 'contain',  }} />
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Welcome Back</h1>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Enter your credentials to access the data</p>
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
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', marginLeft: '4px' }}>
                                    Username
                                </label>
                                <input
                                    className="apple-input"
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    placeholder="name@example.com"
                                    style={{pointerEvents: isLoading ? 'none' : 'auto'}}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
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
                                    placeholder="••••••••"
                                    style={{pointerEvents: isLoading ? 'none' : 'auto'}}
                                />
                            </div>

                            <button type="submit" style={{pointerEvents: isLoading ? 'none' : 'auto'}} className="apple-button" disabled={isLoading}>
                                {isLoading ? (
                                    <><span style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                                ) : "Sign In"}
                            </button>
                        </form>

                        {/* Footer */}
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ pointerEvents: isLoading ? 'none' : 'auto', color: '#ff4b5c', textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s' }}>
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;