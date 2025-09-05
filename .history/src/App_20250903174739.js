import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ShiftSchedule from './pages/ShiftSchedule';
import OncallSchedule from './pages/OncallSchedule';
import PreviousSchedule from './pages/PreviousSchedule';
import Assignments from './pages/Assignments';
import ExchangeShift from './pages/ExchangeShift';
import Payroll from './pages/Payroll';
import OT3A from './pages/OT3A';
import OT3C from './pages/OT3C';
import OT4A from './pages/OT4A';

import AuthWrapper from './components/AuthWrapper';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <AuthWrapper>
        {({ user, userData, onLogout }) => (
          <div className="flex h-screen bg-gray-50">
            {/* ปุ่ม Hamburger Menu */}
            <div className="fixed top-4 left-4 z-40">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Overlay สำหรับทุกขนาดหน้าจอ */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
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
              <Route path="/schedule" element={<ShiftSchedule userData={userData} />} />
              <Route path="/shift-schedule" element={<ShiftSchedule userData={userData} />} />
              <Route path="/oncall-schedule" element={<OncallSchedule userData={userData} />} />
              <Route path="/previous-schedule" element={<PreviousSchedule userData={userData} />} />
              <Route path="/assignments" element={<Assignments userData={userData} />} />
              <Route path="/exchange-shift" element={<ExchangeShift userData={userData} />} />
              <Route path="/payroll" element={<Payroll userData={userData} />} />
              <Route path="/payroll/ot-3a" element={<OT3A userData={userData} />} />
              <Route path="/payroll/ot-3c" element={<OT3C userData={userData} />} />
              <Route path="/payroll/ot-4a" element={<OT4A userData={userData} />} />

                              <Route path="/settings" element={
                userData?.role === 'หัวหน้าหน่วยงาน' ? 
                  <Settings userData={userData} /> : 
                  <div className="p-6 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                      <div className="text-red-600 text-6xl mb-4">🚫</div>
                      <h2 className="text-xl font-bold text-red-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                      <p className="text-red-600">เฉพาะหัวหน้าหน่วยงานเท่านั้นที่สามารถเข้าถึงหน้านี้ได้</p>
                    </div>
                  </div>
              } />

            </Routes>
          </main>
        </div>
        )}
      </AuthWrapper>
    </Router>
  );
}

export default App;
