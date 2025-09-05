import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  ClipboardDocumentListIcon, 
  CalculatorIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Sidebar = ({ onLogout, user }) => {
  const navigate = useNavigate();

  // เมนูสำหรับหัวหน้าหน่วยงาน
  const supervisorMenuItems = [
    { path: '/shift-schedule', name: 'ตารางเวร', icon: CalendarIcon },
    { path: '/previous-schedule', name: 'ตารางเวรก่อนแลก', icon: ClockIcon },
    { path: '/assignments', name: 'ตารางมอบหมายงาน', icon: ClipboardDocumentListIcon },
    { path: '/payroll', name: 'คำนวณเงิน', icon: CalculatorIcon },
    { path: '/settings', name: 'ตั้งค่า', icon: Cog6ToothIcon },
  ];

  // เมนูสำหรับตำแหน่งอื่นๆ
  const otherMenuItems = [
    { path: '/shift-schedule', name: 'ตารางเวร', icon: CalendarIcon },
    { path: '/previous-schedule', name: 'ตารางเวรก่อนแลก', icon: ClockIcon },
    { path: '/assignments', name: 'ตารางมอบหมายงาน', icon: ClipboardDocumentListIcon },
    { path: '/exchange-shift', name: 'แลกเวร', icon: ClockIcon },
  ];

  // เลือกเมนูตามตำแหน่ง
  const menuItems = user?.role === 'หัวหน้าหน่วยงาน' ? supervisorMenuItems : otherMenuItems;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
             <div className="p-6">
         <h1 className="text-2xl font-semibold text-dark-blue text-center">
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
