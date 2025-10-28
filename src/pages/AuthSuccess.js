import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        const user = searchParams.get('user');

        console.log('AuthSuccess - Processing OAuth callback...');
        console.log('Token present:', !!token);
        console.log('User present:', !!user);

        if (token && user) {
          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', user);
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          console.log('Authentication successful! Redirecting...');
          
          // Force full page reload to trigger App.js auth check
          window.location.href = '/albums';
        } else {
          console.error('Missing token or user parameters');
          window.location.href = '/login?error=missing_token';
        }
      } catch (error) {
        console.error('Auth success error:', error);
        window.location.href = '/login?error=auth_failed';
      }
    };

    processAuth();
  }, [searchParams]);

  return (
    <div className="auth-success">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2>Authentication Successful!</h2>
        <p>Redirecting you to your albums...</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default AuthSuccess;