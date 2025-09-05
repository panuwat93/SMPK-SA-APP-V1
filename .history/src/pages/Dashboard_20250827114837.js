import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-blue mb-2">
          ยินดีต้อนรับ
        </h1>
        <p className="text-gray-600 text-lg">
          ระบบจัดการตารางเวรสำหรับหัวหน้างาน
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-dark-blue mb-4">จัดตารางเวร</h3>
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
    </div>
  );
};

export default Dashboard;
