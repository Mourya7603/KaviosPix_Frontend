import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('🔄 AuthSuccess - Processing OAuth');
    
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      console.log('✅ Found OAuth data in AuthSuccess');
      
      // Process and store auth data
      const decodedUser = decodeURIComponent(userParam);
      const userData = JSON.parse(decodedUser);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to albums
      window.location.href = '/albums';
    } else {
      console.log('❌ No OAuth data found in AuthSuccess');
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Processing Authentication...</h2>
      <p>Please wait while we complete your sign in.</p>
    </div>
  );
};

export default AuthSuccess;