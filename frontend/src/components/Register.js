// src/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match!');
            return;
        }
// Policy check
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long!');
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
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                // Handling "User already exists" error
                if (data.username) {
                    setMessage(`Error: ${data.username[0]}`);
                } else if (data.password) {
                    setMessage(`Error: ${data.password[0]}`);
                } else {
                    setMessage('Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            setMessage('Network error. Please check if the server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        disabled={isLoading}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        disabled={isLoading}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register New Account'}
                </button>
            </form>
            <p style={{ color: message.includes('successful') ? 'green' : 'red' }}>
                {message}
            </p>
            <p>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default Register;