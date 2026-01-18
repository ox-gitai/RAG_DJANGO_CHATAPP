// frontend/src/App.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
    const navigate = useNavigate();

    React.useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        
        if (accessToken) {
            try {
                // Decode the JWT token payload (middle part)
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                const expirationTime = payload.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();

                // Check if token is expired
                if (currentTime >= expirationTime) {
                    // Token expired - clear it and go to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
                } else {
                    // Token valid - go to conversation
                    navigate('/conversation');
                }
            } catch (e) {
                // If token is malformed, treat as invalid
                localStorage.removeItem('access_token');
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <p>Redirecting...</p>
        </div>
    );
}

export default App;