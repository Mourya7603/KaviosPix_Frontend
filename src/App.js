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
        console.log('🚀 App.js - Starting authentication check');
        console.log('📍 Current URL:', window.location.href);
        console.log('🔍 Pathname:', window.location.pathname);
        console.log('🔍 Search:', window.location.search);
        
        // Method 1: Check URL parameters using URL constructor (most reliable)
        let token, userParam;
        try {
          const url = new URL(window.location.href);
          token = url.searchParams.get('token');
          userParam = url.searchParams.get('user');
        } catch (e) {
          // Fallback to URLSearchParams
          const urlParams = new URLSearchParams(window.location.search);
          token = urlParams.get('token');
          userParam = urlParams.get('user');
        }

        console.log('📦 URL Parameters Found:', {
          token: token ? `PRESENT (${token.substring(0, 20)}...)` : 'MISSING',
          user: userParam ? `PRESENT (${userParam.substring(0, 50)}...)` : 'MISSING'
        });

        // PROCESS OAUTH CALLBACK FROM URL
        if (token && userParam) {
          console.log('🎯 PROCESSING OAUTH CALLBACK FROM URL');
          
          try {
            // Step 1: Decode the URL-encoded user data
            console.log('🔄 Step 1: Decoding user data...');
            const decodedUser = decodeURIComponent(userParam);
            console.log('✅ Decoded user string:', decodedUser);

            // Step 2: Parse JSON
            console.log('🔄 Step 2: Parsing JSON...');
            const userData = JSON.parse(decodedUser);
            console.log('✅ Parsed user data:', userData);

            // Step 3: Store in localStorage
            console.log('🔄 Step 3: Storing in localStorage...');
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ localStorage set');

            // Step 4: Set axios header
            console.log('🔄 Step 4: Setting axios header...');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Step 5: Set React state
            console.log('🔄 Step 5: Setting React state...');
            setUser(userData);
            
            // Step 6: Clean URL
            console.log('🔄 Step 6: Cleaning URL...');
            const cleanPath = window.location.pathname === '/' ? '/' : '/albums';
            window.history.replaceState({}, document.title, cleanPath);
            
            console.log('✅ ✅ ✅ OAUTH PROCESSING COMPLETE - USER AUTHENTICATED');
            setLoading(false);
            return;
            
          } catch (error) {
            console.error('❌ ERROR PROCESSING OAUTH DATA:', error);
            console.error('Error details:', error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        // CHECK LOCALSTORAGE FOR EXISTING AUTH
        console.log('🔍 Checking localStorage for existing auth...');
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('💾 LocalStorage Contents:', {
          token: storedToken ? `PRESENT (${storedToken.substring(0, 20)}...)` : 'MISSING',
          user: storedUser ? 'PRESENT' : 'MISSING'
        });

        if (storedToken && storedUser) {
          try {
            console.log('🔄 Processing stored authentication...');
            const userData = JSON.parse(storedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setUser(userData);
            console.log('✅ User authenticated from localStorage:', userData.email);
          } catch (error) {
            console.error('❌ Error parsing stored user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('❌ No authentication found anywhere');
          setUser(null);
        }
        
      } catch (error) {
        console.error('💥 CRITICAL Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        console.log('🏁 Auth check completed - Loading:', false);
        setLoading(false);
      }
    };

    // Add a small delay to ensure everything is loaded
    setTimeout(checkAuth, 100);
  }, []);

  // Debug: Log when user state changes
  useEffect(() => {
    console.log('🔄 User state updated:', user ? user.email : 'null');
  }, [user]);

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

  console.log('🎯 FINAL APP RENDER - User:', user ? user.email : 'Not authenticated');

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