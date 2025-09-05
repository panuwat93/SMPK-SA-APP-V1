import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AuthWrapper from './components/AuthWrapper';

function App() {
  return (
    <Router>
      <AuthWrapper>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/schedule" element={<div className="p-6 text-dark-blue">จัดตารางเวร</div>} />
              <Route path="/previous-schedule" element={<div className="p-6 text-dark-blue">ตารางเวรก่อนแลก</div>} />
              <Route path="/assignments" element={<div className="p-6 text-dark-blue">ตารางมอบหมายงาน</div>} />
              <Route path="/payroll" element={<div className="p-6 text-dark-blue">คำนวณเงิน</div>} />
              <Route path="/settings" element={<div className="p-6 text-dark-blue">ตั้งค่า</div>} />
            </Routes>
          </main>
        </div>
      </AuthWrapper>
    </Router>
  );
}

export default App;
