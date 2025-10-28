import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './AuthError.css';

const AuthError = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Authentication failed';

  return (
    <div className="auth-error">
      <div className="error-card">
        <div className="error-icon">❌</div>
        <h2>Authentication Error</h2>
        <p>{message}</p>
        <Link to="/login" className="retry-btn">
          Try Again
        </Link>
      </div>
    </div>
  );
};

export default AuthError;