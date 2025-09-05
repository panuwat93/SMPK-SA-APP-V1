import React from 'react';

const Dashboard = ({ user }) => {
  const isSupervisor = user?.role === 'หัวหน้าหน่วยงาน';
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-blue mb-2">
          ยินดีต้อนรับ
        </h1>
                 <p className="text-gray-600 text-lg">
           {isSupervisor 
             ? 'ระบบ SMPK-SA สำหรับหัวหน้างาน' 
             : 'ระบบ SMPK-SA สำหรับพนักงาน'
           }
         </p>
      </div>
      
      {isSupervisor ? (
        // Dashboard สำหรับหัวหน้าหน่วยงาน
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางเวร</h3>
            <p className="text-gray-600">สร้างและจัดการตารางเวรของพนักงาน</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางเวรก่อนแลก</h3>
            <p className="text-gray-600">ดูประวัติตารางเวรก่อนการแลกเปลี่ยน</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-blue mb-4">ตารางมอบหมายงาน</h3>
            <p className="text-gray-600">จัดการการมอบหมายงานให้พนักงาน</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-blue mb-4">คำนวณเงิน</h3>
            <p className="text-gray-600">คำนวณเงินเดือนและค่าล่วงเวลา</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-blue mb-4">ตั้งค่า</h3>
            <p className="text-gray-600">จัดการการตั้งค่าระบบ</p>
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
