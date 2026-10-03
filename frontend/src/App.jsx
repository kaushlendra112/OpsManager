import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import WorkItem from './WorkItem';
import api from './api';
import { LogOut, User } from 'lucide-react';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/me')
                .then(res => {
                    setUser(res.data.user);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-lg font-medium text-gray-600 animate-pulse">Loading...</div>
        </div>
    );

    if (!user) {
        return <Login onLogin={setUser} />;
    }

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <nav className="bg-indigo-600 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="shrink-0 flex items-center">
                                <h1 className="text-white text-xl font-bold tracking-tight">OpsManager</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-indigo-100 px-3 py-2 rounded-md text-sm font-medium">
                                    <User className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Logged in as </span>
                                    <span className="font-bold ml-1">{user.username}</span> 
                                    <span className="hidden sm:inline text-indigo-300 ml-1">({user.role})</span>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-2 hidden sm:inline" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                    <Routes>
                        <Route path="/" element={<Dashboard user={user} />} />
                        <Route path="/item/:id" element={<WorkItem user={user} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
