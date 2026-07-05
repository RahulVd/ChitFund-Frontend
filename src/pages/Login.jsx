    import React, { useState } from 'react';
    import { login } from '../services/api';
    import { useNavigate } from 'react-router-dom';

    function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        login(username, password)
        .then(res => {
            localStorage.setItem('token', res.data.token);
            navigate('/');
        })
        .catch(() => setError('Invalid username or password'));
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-80">
            <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">Chit Fund Login</h1>
            <input
            className="border border-gray-200 rounded-lg p-2 w-full mb-3 text-sm"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            />
            <input
            className="border border-gray-200 rounded-lg p-2 w-full mb-3 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
            Login
            </button>
        </div>
        </div>
    );
    }

    export default Login;