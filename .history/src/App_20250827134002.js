import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AuthWrapper from './components/AuthWrapper';

function App() {
  return (
    <Router>
      <AuthWrapper>
        {({ user, userData, onLogout }) => (
          <div className="flex h-screen bg-gray-50">
            <Sidebar onLogout={onLogout} user={userData} />
            <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={userData} />} />
              <Route path="/schedule" element={<div className="p-6 text-dark-blue">ตารางเวร</div>} />
              <Route path="/previous-schedule" element={<div className="p-6 text-dark-blue">ตารางเวรก่อนแลก</div>} />
              <Route path="/assignments" element={<div className="p-6 text-dark-blue">ตารางมอบหมายงาน</div>} />
              <Route path="/exchange-shift" element={<div className="p-6 text-dark-blue">แลกเวร</div>} />
              <Route path="/payroll" element={<div className="p-6 text-dark-blue">คำนวณเงิน</div>} />
              <Route path="/settings" element={<Settings userData={userData} />} />
            </Routes>
          </main>
        </div>
        )}
      </AuthWrapper>
    </Router>
  );
}

export default App;
