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
import OT4A2 from './pages/OT4A-2';
import OT4A3 from './pages/OT4A-3';
import OT4C from './pages/OT4C';
import OT4C2 from './pages/OT4C-2';
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';

import AuthWrapper from './components/AuthWrapper';
import UpdatePrompt from './components/UpdatePrompt';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <UpdatePrompt />
      <Router>
        <AuthWrapper>
        {({ user, userData, onLogout }) => (
          <div className="flex h-screen bg-gray-50">
            {/* ปุ่ม Hamburger Menu */}
            <div className="fixed top-4 left-4 z-[60]">
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
              <Route path="/payroll/ot-4a-2" element={<OT4A2 userData={userData} />} />
              <Route path="/payroll/ot-4a-3" element={<OT4A3 userData={userData} />} />
              <Route path="/payroll/ot-4c" element={<OT4C userData={userData} />} />
              <Route path="/payroll/ot-4c-2" element={<OT4C2 userData={userData} />} />
              <Route path="/change-password" element={<ChangePassword userData={userData} />} />
              <Route path="/edit-profile" element={<EditProfile userData={userData} />} />

                              <Route path="/settings" element={
                userData?.userType === 'Admin' ? 
                  <Settings userData={userData} /> : 
                  <div className="p-6 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                      <div className="text-red-600 text-6xl mb-4">🚫</div>
                      <h2 className="text-xl font-bold text-red-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                      <p className="text-red-600">เฉพาะ Admin เท่านั้นที่สามารถเข้าถึงหน้านี้ได้</p>
                    </div>
                  </div>
              } />

            </Routes>
          </main>
        </div>
        )}
        </AuthWrapper>
      </Router>
    </>
  );
}

export default App;
