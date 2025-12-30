import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './components/Login';
import ChatPage from './components/ChatPage'
import Register from './components/Register';
import reportWebVitals from './reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter([

    {
        path: "/",
        element: <App/>
    },
    {
        path: "/conversation",
        element: <ChatPage/>
    },
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/register",
        element: <Register/>
    },
  ]
)
console.log('Router:', router);
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
