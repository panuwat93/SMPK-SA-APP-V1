import React from 'react';

const PreviousSchedule = ({ userData }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <div className="w-full">
        {/* หัวข้อ */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">ตารางเวรก่อนแลก</h1>
            <p className="text-gray-600 mt-2">หน้าเปล่า</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviousSchedule;
