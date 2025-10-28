import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `https://kavios-pix-backend-blond.vercel.app/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`https://kavios-pix-backend-blond.vercel.app${endpoint}`, formData);
      
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // SIMPLE FIX: Reload the page to go to albums
      window.location.href = '/albums';
      
    } catch (error) {
      console.error('Auth error:', error);
      const message = error.response?.data?.message || 'Authentication failed';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">📸</span>
            <span className="logo-text">KaviosPix</span>
          </div>
          <p className="login-subtitle">Your personal photo gallery</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <div className="login-content">
          <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p>{isLogin ? 'Sign in to access your photos and albums' : 'Sign up to start your photo journey'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <div className="login-features">
            <div className="feature">
              <span className="feature-icon">🖼️</span>
              <span>Unlimited photo storage</span>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <span>Share with friends & family</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>Secure and private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;