import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  ClipboardDocumentListIcon, 
  CalculatorIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ onLogout, user, isOpen, onToggle }) => {
  const navigate = useNavigate();

  // เมนูสำหรับหัวหน้าหน่วยงาน
  const supervisorMenuItems = [
    { path: '/', name: 'หน้าหลัก', icon: HomeIcon },
    { path: '/shift-schedule', name: 'ตารางเวร', icon: CalendarIcon },
    { path: '/oncall-schedule', name: 'ตารางเวร Oncall', icon: CalendarIcon },
    { path: '/previous-schedule', name: 'ตารางเวรก่อนแลก', icon: ClockIcon },
    { path: '/assignments', name: 'ตารางมอบหมายงาน', icon: ClipboardDocumentListIcon },
    { path: '/exchange-shift', name: 'แลกเวร', icon: ArrowRightOnRectangleIcon },
    { path: '/payroll', name: 'คำนวณเงิน', icon: CalculatorIcon },
    { path: '/settings', name: 'ตั้งค่า', icon: Cog6ToothIcon },
  ];

  // เมนูสำหรับตำแหน่งอื่นๆ
  const otherMenuItems = [
    { path: '/', name: 'หน้าหลัก', icon: HomeIcon },
    { path: '/shift-schedule', name: 'ตารางเวร', icon: CalendarIcon },
    { path: '/oncall-schedule', name: 'ตารางเวร Oncall', icon: CalendarIcon },
    { path: '/assignments', name: 'ตารางมอบหมายงาน', icon: ClipboardDocumentListIcon },
    { path: '/exchange-shift', name: 'แลกเวร', icon: ArrowRightOnRectangleIcon },
  ];

  // เลือกเมนูตามประเภทผู้ใช้
  const menuItems = user?.userType === 'Admin' ? supervisorMenuItems : otherMenuItems;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out w-64 sm:w-72 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
             <div className="p-4 sm:p-6">
         <h1 className="text-xl sm:text-2xl font-semibold text-dark-blue text-center">
           SMPK-SA
         </h1>
       </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-dark-blue rounded-lg transition-colors duration-200 hover:bg-blue-50 ${
                  isActive ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="mt-8 px-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 rounded-lg transition-colors duration-200 hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
