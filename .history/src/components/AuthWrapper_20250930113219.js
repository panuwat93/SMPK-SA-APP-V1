import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Login from './Login';
import Signup from './Signup';

const AuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // ตรวจสอบข้อมูลผู้ใช้จาก sessionStorage (เก็บเฉพาะ session ปัจจุบัน)
    const currentUserId = sessionStorage.getItem('currentUserId');
    if (currentUserId) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: currentUserId });
            setUserData({
              uid: currentUserId,
              ...userData
            });
          } else {
            // ถ้าไม่พบข้อมูลในฐานข้อมูล ให้ลบ session
            sessionStorage.removeItem('currentUserId');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          sessionStorage.removeItem('currentUserId');
        }
      };
      fetchUserData();
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // ลบข้อมูลผู้ใช้จาก sessionStorage
    sessionStorage.removeItem('currentUserId');
    setUser(null);
    setUserData(null);
  };

  const handleLoginSuccess = () => {
    // ตรวจสอบข้อมูลผู้ใช้จาก localStorage อีกครั้ง
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUser({ uid: userData.uid });
        setUserData(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    // ตรวจสอบข้อมูลผู้ใช้จาก localStorage อีกครั้ง
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUser({ uid: userData.uid });
        setUserData(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
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
  if (typeof children === 'function') {
    return children({ user, userData, onLogout: handleLogout });
  }
  return children;
};

export default AuthWrapper;
