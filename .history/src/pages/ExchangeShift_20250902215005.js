import React from 'react';

const ExchangeShift = ({ userData }) => {
  const isSupervisor = userData?.role === 'หัวหน้าหน่วยงาน';

  // ถ้าเป็นหัวหน้า ให้แสดงข้อความว่าไม่สามารถเข้าถึงได้
  if (isSupervisor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">ไม่สามารถเข้าถึงได้</h2>
            <p className="text-red-600">หน้านี้สำหรับเจ้าหน้าที่เท่านั้น</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            แลกเวร
          </h1>
          <p className="text-gray-600">
            เลือกประเภทการดำเนินการที่ต้องการ
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* แลกเวร */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">แลกเวร</h3>
            <p className="text-gray-600 leading-relaxed">
              ขอแลกเวรกับเจ้าหน้าที่คนอื่น
            </p>
          </div>

          {/* ยกเวร */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">ยกเวร</h3>
            <p className="text-gray-600 leading-relaxed">
              ขอยกเวรให้เจ้าหน้าที่คนอื่น
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeShift;
