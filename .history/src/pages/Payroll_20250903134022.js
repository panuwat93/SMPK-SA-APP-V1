import React from 'react';
import { Link } from 'react-router-dom';

const Payroll = ({ userData }) => {
  const payrollForms = [
    {
      id: 'ot-3a',
      name: 'แบบฟอร์ม OT-3A',
      description: 'แบบฟอร์มคำนวณเงินล่วงเวลา 3A',
      path: '/payroll/ot-3a',
      color: 'bg-blue-200 hover:bg-blue-300 text-blue-800'
    },
    {
      id: 'ot-3c',
      name: 'แบบฟอร์ม OT-3C',
      description: 'แบบฟอร์มคำนวณเงินล่วงเวลา 3C',
      path: '/payroll/ot-3c',
      color: 'bg-green-200 hover:bg-green-300 text-green-800'
    },
    {
      id: 'ot-4a',
      name: 'แบบฟอร์ม OT-4A',
      description: 'แบบฟอร์มคำนวณเงินล่วงเวลา 4A',
      path: '/payroll/ot-4a',
      color: 'bg-purple-200 hover:bg-purple-300 text-purple-800'
    },
    {
      id: 'ot-4c',
      name: 'แบบฟอร์ม OT-4C',
      description: 'แบบฟอร์มคำนวณเงินล่วงเวลา 4C',
      path: '/payroll/ot-4c',
      color: 'bg-orange-200 hover:bg-orange-300 text-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* หัวข้อ */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">คำนวณเงิน</h1>
            <p className="text-gray-600">เลือกแบบฟอร์มที่ต้องการคำนวณเงินล่วงเวลา</p>
          </div>
        </div>

        {/* เมนูแบบฟอร์ม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payrollForms.map((form) => (
            <Link
              key={form.id}
              to={form.path}
              className={`block p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${form.color}`}
            >
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{form.name}</h3>
                <p className="text-sm opacity-80">{form.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
