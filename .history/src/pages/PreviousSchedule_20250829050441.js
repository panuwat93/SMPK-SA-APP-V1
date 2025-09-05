import React from 'react';

const PreviousSchedule = ({ userData }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <div className="w-full">
        {/* หัวข้อ */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 text-center">ตารางเวรก่อนแลก</h1>
        </div>
        
        {/* หน้าเปล่า */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">หน้าเปล่า</h3>
          <p className="text-gray-500">รอการกำหนดรูปแบบใหม่</p>
        </div>
      </div>
    </div>
  );
};

export default PreviousSchedule;
