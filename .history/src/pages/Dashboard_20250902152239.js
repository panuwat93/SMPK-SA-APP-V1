import React from 'react';

const Dashboard = ({ user }) => {
  const isSupervisor = user?.role === 'หัวหน้าหน่วยงาน';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          ยินดีต้อนรับ
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {isSupervisor 
            ? 'ระบบจัดการตารางเวรและคำนวณเงิน สำหรับหัวหน้าหน่วยงาน' 
            : 'ระบบ SMPK-SA สำหรับพนักงาน'
          }
        </p>
        {isSupervisor && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            สิทธิ์การเข้าถึง: หัวหน้าหน่วยงาน
          </div>
        )}
      </div>
      
      {isSupervisor ? (
        // Dashboard สำหรับหัวหน้าหน่วยงาน
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* ตารางเวร */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ตารางเวร</h3>
              <p className="text-gray-600 leading-relaxed">สร้างและจัดการตารางเวรของพนักงานในหน่วยงาน</p>
            </div>
            
            {/* ตารางเวรก่อนแลก */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ตารางเวรก่อนแลก</h3>
              <p className="text-gray-600 leading-relaxed">ดูประวัติตารางเวรก่อนการแลกเปลี่ยน</p>
            </div>
            
            {/* ตารางมอบหมายงาน */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ตารางมอบหมายงาน</h3>
              <p className="text-gray-600 leading-relaxed">จัดการการมอบหมายงานให้พนักงาน</p>
            </div>
            
            {/* คำนวณเงิน */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">คำนวณเงิน</h3>
              <p className="text-gray-600 leading-relaxed">คำนวณเงินเดือนและค่าล่วงเวลาของพนักงาน</p>
            </div>
            
            {/* ตั้งค่า */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ตั้งค่า</h3>
              <p className="text-gray-600 leading-relaxed">จัดการการตั้งค่าระบบและข้อมูลหน่วยงาน</p>
            </div>

            {/* การ์ดเพิ่มเติม - รายงาน */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">รายงาน</h3>
              <p className="text-gray-600 leading-relaxed">ดูรายงานสรุปการทำงานและสถิติต่างๆ</p>
            </div>
          </div>
        </div>
      ) : (
                 // Dashboard สำหรับตำแหน่งอื่นๆ
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
             <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางเวร</h3>
             <p className="text-gray-600">ดูตารางเวรของตนเอง</p>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
             <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางเวรก่อนแลก</h3>
             <p className="text-gray-600">ดูประวัติตารางเวรก่อนการแลกเปลี่ยน</p>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
             <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางมอบหมายงาน</h3>
             <p className="text-gray-600">ดูงานที่ได้รับมอบหมาย</p>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
             <h3 className="text-xl font-semibold text-dark-blue mb-4">แลกเวร</h3>
             <p className="text-gray-600">ขอแลกเวรกับเพื่อนร่วมงาน</p>
           </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
