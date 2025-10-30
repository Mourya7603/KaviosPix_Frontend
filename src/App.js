import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Albums from './pages/Albums';
import AlbumDetail from './pages/AlbumDetail';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import Upload from './pages/Upload';
import Trash from './pages/Trash';
import AuthSuccess from './pages/AuthSuccess';
import AuthError from './pages/AuthError';
import './App.css';
import './components/Toast.css';

// API configuration
axios.defaults.baseURL = 'https://kavios-pix-backend-blond.vercel.app';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is logged in when app starts
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('App.js - Auth check:', { 
          hasToken: !!token, 
          hasUserData: !!userData 
        });

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            console.log('User authenticated:', user.email);
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="app">
          {user ? (
            // Logged-in layout
            <>
              <Sidebar />
              <div className="app-main">
                <Header 
                  onSearch={setSearchQuery} 
                  searchQuery={searchQuery} 
                  user={user} 
                  onLogout={logout} 
                />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Navigate to="/albums" replace />} />
                    <Route path="/albums" element={<Albums />} />
                    <Route path="/album/:albumId" element={<AlbumDetail searchQuery={searchQuery} />} />
                    <Route path="/favorites" element={<Favorites searchQuery={searchQuery} />} />
                    <Route path="/recent" element={<Recent searchQuery={searchQuery} />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/trash" element={<Trash searchQuery={searchQuery} />} />
                    <Route path="/auth/success" element={<AuthSuccess />} />
                    <Route path="/auth/error" element={<AuthError />} />
                    <Route path="*" element={<Navigate to="/albums" replace />} />
                  </Routes>
                </main>
              </div>
            </>
          ) : (
            // Logged-out layout
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;