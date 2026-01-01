// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';

// const Register = () => {
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [message, setMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setMessage('');
//         setIsLoading(true);

//         if (password !== confirmPassword) {
//             setMessage('Passwords do not match!');
//             setIsLoading(false);
//             return;
//         }

//         if (password.length < 6) {
//             setMessage('Password must be at least 6 characters long.');
//             setIsLoading(false);
//             return;
//         }

//         try {
//             const response = await fetch('http://127.0.0.1:8000/api/register/', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     username: username,
//                     password: password
//                 })
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 setMessage('Registration successful! Redirecting to login...');
//                 setTimeout(() => {
//                     navigate('/login');
//                 }, 1000);
//             } else {
//                 const errorMsg = data.error || 'Registration failed. Please try again.';
//                 setMessage(errorMsg);
//             }
//         } catch (error) {
//             console.error('Registration error:', error);
//             setMessage('An error occurred. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h2>Register</h2>
//             <form onSubmit={handleSubmit}>
//                 <div>
//                     <label>Username:</label>
//                     <input
//                         type="text"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                         disabled={isLoading}
//                     />
//                 </div>
//                 <div>
//                     <label>Password:</label>
//                     <input
//                         type="password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                         disabled={isLoading}
//                     />
//                 </div>
//                 <div>
//                     <label>Confirm Password:</label>
//                     <input
//                         type="password"
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         required
//                         disabled={isLoading}
//                     />
//                 </div>
//                 <button type="submit" disabled={isLoading}>
//                     {isLoading ? 'Registering...' : 'Register'}
//                 </button>
//             </form>
//             {message && <p>{message}</p>}
//             <p>
//                 Already have an account? <Link to="/login">Login here</Link>
//             </p>
//         </div>
//     );
// };

// export default Register;
