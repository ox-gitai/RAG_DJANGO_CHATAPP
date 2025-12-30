// src/App.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
    const navigate = useNavigate();

    React.useEffect(() => {
        // Check if user is authenticated
        const accessToken = localStorage.getItem('access_token');
        
        if (accessToken) {
            // User is logged in, redirect to chat
            navigate('/conversation');
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