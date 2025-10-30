import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        console.log('🔐 AuthSuccess - Processing OAuth callback');
        console.log('✅ Token present:', !!token);
        console.log('👤 User present:', !!userParam);

        if (token && userParam) {
          // DECODE and PARSE the user parameter
          const decodedUser = decodeURIComponent(userParam);
          const userData = JSON.parse(decodedUser);
          
          console.log('📋 Parsed user data:', userData);

          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          console.log('🎉 Authentication successful! Navigating to albums...');
          
          // Use React Router navigation
          navigate('/albums', { replace: true });
          
        } else {
          console.error('❌ Missing token or user parameters');
          navigate('/login?error=missing_auth_data', { replace: true });
        }
      } catch (error) {
        console.error('💥 Auth success error:', error);
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    processAuth();
  }, [searchParams, navigate]);

  return (
    <div className="auth-success" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Authentication Successful!</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>Completing sign in process...</p>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AuthSuccess;