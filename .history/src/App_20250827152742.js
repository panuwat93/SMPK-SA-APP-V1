import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ShiftSchedule from './pages/ShiftSchedule';
import AuthWrapper from './components/AuthWrapper';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <AuthWrapper>
        {({ user, userData, onLogout }) => (
          <div className="flex h-screen bg-gray-50">
            {/* ปุ่ม Hamburger Menu */}
            <div className="lg:hidden fixed top-4 left-4 z-40">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Overlay สำหรับหน้าจอเล็ก */}
            {sidebarOpen && (
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <Sidebar 
              onLogout={onLogout} 
              user={userData} 
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(false)}
            />
            <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={userData} />} />
              <Route path="/schedule" element={<div className="p-6 text-dark-blue">ตารางเวร</div>} />
              <Route path="/previous-schedule" element={<div className="p-6 text-dark-blue">ตารางเวรก่อนแลก</div>} />
              <Route path="/assignments" element={<div className="p-6 text-dark-blue">ตารางมอบหมายงาน</div>} />
              <Route path="/exchange-shift" element={<div className="p-6 text-dark-blue">แลกเวร</div>} />
              <Route path="/payroll" element={<div className="p-6 text-dark-blue">คำนวณเงิน</div>} />
                              <Route path="/settings" element={<Settings userData={userData} />} />
                <Route path="/shift-schedule" element={<ShiftSchedule userData={userData} />} />
            </Routes>
          </main>
        </div>
        )}
      </AuthWrapper>
    </Router>
  );
}

export default App;
