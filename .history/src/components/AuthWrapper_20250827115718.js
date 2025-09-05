import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Login from './Login';
import Signup from './Signup';

const AuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLoginSuccess = () => {
    // User is automatically set by onAuthStateChanged
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    // User is automatically set by onAuthStateChanged
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showSignup) {
      return (
        <Signup
          onSwitchToLogin={() => setShowSignup(false)}
          onSignupSuccess={handleSignupSuccess}
        />
      );
    }

    return (
      <Login
        onSwitchToSignup={() => setShowSignup(true)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // User is authenticated, render the main app with logout functionality
  return React.cloneElement(children, { user, onLogout: handleLogout });
};

export default AuthWrapper;
