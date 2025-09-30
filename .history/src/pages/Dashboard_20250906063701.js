import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Dashboard = ({ user }) => {
  const isSupervisor = user?.userType === 'Admin';
  
  // States สำหรับปฏิทิน
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลทีม
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user?.department) return;
      
      try {
        console.log('Fetching team for department:', user.department);
        const teamDoc = await getDoc(doc(db, 'teams', user.department));
        if (teamDoc.exists()) {
          const data = teamDoc.data();
          console.log('Team data:', data);
          setTeamMembers(data.members || []);
        } else {
          console.log('No team document found for department:', user.department);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [user?.department]);

  // ดึงข้อมูลตัวเลือกเวร
  useEffect(() => {
    const fetchShiftOptions = async () => {
      if (!user?.department) return;
      
      try {
        console.log('Fetching shift options for department:', user.department);
        const shiftOptionsRef = doc(db, 'shiftOptions', user.department);
        const shiftOptionsDoc = await getDoc(shiftOptionsRef);
        
        if (shiftOptionsDoc.exists()) {
          const options = shiftOptionsDoc.data().options || [];
          console.log('Shift options:', options);
          setShiftOptions(options);
        } else {
          console.log('No shift options found for department:', user.department);
        }
      } catch (error) {
        console.error('Error fetching shift options:', error);
      }
    };

    fetchShiftOptions();
  }, [user?.department]);

  // ดึงข้อมูลตารางเวร
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!user?.uid || !user?.department) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        const docId = `${user.department}-${monthKey}`;
        
        console.log('Fetching schedule for:', docId, 'User:', user.uid, 'Department:', user.department);
        
        const scheduleDoc = await getDoc(doc(db, 'schedules', docId));
        if (scheduleDoc.exists()) {
          const data = scheduleDoc.data();
          console.log('Schedule data found:', data);
          console.log('Schedule array:', data.schedule);
          console.log('Team members:', teamMembers);
          setScheduleData(data);
        } else {
          console.log('No schedule data found for:', docId);
          setScheduleData(null);
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        setScheduleData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [currentDate, user?.uid, user?.department]);

  // ฟังก์ชันเปลี่ยนเดือน
  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // ฟังก์ชันสร้างปฏิทิน
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  // ฟังก์ชันดึงเวรของเจ้าหน้าที่ในวันนั้น
  const getStaffShifts = (date) => {
    if (!scheduleData?.schedule || !user?.uid) {
      console.log('No schedule data or user uid:', { scheduleData: !!scheduleData?.schedule, userUid: !!user?.uid });
      return { topShift: '', bottomShift: '', topShiftStyle: null, bottomShiftStyle: null };
    }
    
    // ตรวจสอบว่าเป็นเดือนเดียวกันกับ currentDate หรือไม่
    const isCurrentMonth = date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    
    if (!isCurrentMonth) {
      console.log('Date is not in current month, no shifts to show:', date.getDate(), date.getMonth(), currentDate.getMonth());
      return { topShift: '', bottomShift: '', topShiftStyle: null, bottomShiftStyle: null };
    }
    
    const dayIndex = date.getDate() - 1;
    console.log('Getting shifts for day:', dayIndex, 'Date:', date.getDate(), 'User UID:', user.uid, 'Current Month:', currentDate.getMonth());
    
    // ใช้ user.uid โดยตรงในการดึงข้อมูลตารางเวร
    const memberSchedule = scheduleData.schedule[user.uid];
    console.log('Member schedule for UID:', user.uid, memberSchedule);
    
    if (!memberSchedule) {
      console.log('No schedule found for user UID:', user.uid);
      return { topShift: '', bottomShift: '', topShiftStyle: null, bottomShiftStyle: null };
    }
    
    const daySchedule = memberSchedule[dayIndex];
    const topShift = daySchedule?.top || '';
    const bottomShift = daySchedule?.bottom || '';
    
    // ดึงสีจาก cellStyles - ใช้ user.uid โดยตรง
    const topCellKey = `${user.uid}-${dayIndex}-top`;
    const bottomCellKey = `${user.uid}-${dayIndex}-bottom`;
    const topShiftStyle = scheduleData.cellStyles?.[topCellKey];
    const bottomShiftStyle = scheduleData.cellStyles?.[bottomCellKey];
    
    console.log('Cell keys:', { topCellKey, bottomCellKey });
    console.log('Cell styles:', { topShiftStyle, bottomShiftStyle });
    
    console.log('Shifts for day', dayIndex, ':', { 
      topShift, 
      bottomShift, 
      userUid: user.uid,
      memberSchedule,
      daySchedule,
      isCurrentMonth,
      topShiftStyle,
      bottomShiftStyle
    });
    
    return { topShift, bottomShift, topShiftStyle, bottomShiftStyle };
  };

  // ฟังก์ชันแปลงเวรเป็นสี (ให้ตรงกับตารางเวร)
  const getShiftColor = (shift, cellStyle = null) => {
    // หาสีจาก shiftOptions ก่อน
    const shiftOption = shiftOptions.find(option => option.name === shift);
    if (shiftOption) {
      // ถ้าเป็นเวร ช/บ/ด และมี cellStyle ให้ใช้สีจาก cellStyle
      if ((shift === 'ช' || shift === 'บ' || shift === 'ด') && cellStyle) {
        return {
          backgroundColor: '#ffffff',
          color: cellStyle.textColor || '#000000',
          className: 'px-1 py-0.5 rounded text-xs'
        };
      }
      
      // ถ้าเป็นเวร MB และมี cellStyle ให้ใช้สีจาก cellStyle
      if (shift === 'MB' && cellStyle) {
        return {
          backgroundColor: '#16a34a', // พื้นเขียว
          color: cellStyle.textColor || '#000000',
          className: 'px-1 py-0.5 rounded text-xs'
        };
      }
      
      // เวรอื่นๆ ใช้สีจาก shiftOptions
      const textColor = shiftOption.textColor || '#000000';
      const bgColor = shiftOption.backgroundColor || '#ffffff';
      
      return {
        backgroundColor: bgColor,
        color: textColor,
        className: 'px-1 py-0.5 rounded text-xs'
      };
    }
    
    // ถ้าไม่เจอใน shiftOptions ให้ใช้สีเริ่มต้น
    switch (shift) {
      case 'ช': return 'bg-red-100 text-red-800'; // สีแดง
      case 'บ': return 'bg-gray-100 text-gray-800'; // สีดำ
      case 'ด': return 'bg-gray-100 text-gray-800'; // สีดำ
      case 'MB': return 'bg-green-500 text-white'; // พื้นเขียว ตัวขาว (default)
      case 'VA': return 'bg-red-500 text-black'; // พื้นแดง ตัวดำ
      case 'O': return 'bg-white text-red-600'; // พื้นขาว ตัวแดง
      case 'ประชุม': return 'bg-white text-gray-600'; // สีขาว
      case 'ช*': return 'bg-white text-purple-600'; // พื้นขาว ตัวม่วง
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // ฟังก์ชันแปลงเวรเป็นชื่อ
  const getShiftName = (shift) => {
    switch (shift) {
      case 'ช': return 'เช้า';
      case 'บ': return 'บ่าย';
      case 'ด': return 'ดึก';
      case 'MB': return 'MB';
      default: return shift;
    }
  };
  
  return (
    <>
      <style>{`
        /* Auto Landscape Mode for Mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .dashboard-container {
            padding: 8px !important;
          }
          
          .dashboard-header {
            margin-bottom: 16px !important;
          }
          
          .dashboard-header h1 {
            font-size: 1.25rem !important;
            margin-bottom: 8px !important;
          }
          
          .dashboard-header p {
            font-size: 0.875rem !important;
          }
          
          .dashboard-logo {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 12px !important;
          }
          
          .dashboard-admin-badge {
            padding: 4px 8px !important;
            font-size: 0.75rem !important;
          }
          
          .calendar-container {
            padding: 12px !important;
            margin-bottom: 12px !important;
          }
          
          .calendar-header {
            margin-bottom: 8px !important;
          }
          
          .calendar-header h2 {
            font-size: 1rem !important;
          }
          
          .calendar-nav-button {
            padding: 4px !important;
          }
          
          .calendar-nav-text {
            font-size: 0.875rem !important;
          }
          
          .calendar-table th,
          .calendar-table td {
            padding: 2px !important;
            height: 48px !important;
            width: 48px !important;
          }
          
          .calendar-date {
            font-size: 0.625rem !important;
            margin-bottom: 2px !important;
          }
          
          .calendar-shift {
            font-size: 0.625rem !important;
            padding: 1px 2px !important;
            margin-bottom: 1px !important;
          }
          
          .admin-calendar .calendar-table th,
          .admin-calendar .calendar-table td {
            height: 32px !important;
            width: 32px !important;
          }
        }
      `}</style>
      
      <div className="dashboard-container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="dashboard-header mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
          <img 
            src="/logo.png" 
            alt="SMPK-SA Logo" 
            className="dashboard-logo w-20 h-20 object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          ยินดีต้อนรับ
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'ยินดีต้อนรับ'}
        </p>
        {isSupervisor && (
          <div className="dashboard-admin-badge mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            สิทธิ์การเข้าถึง: Admin
          </div>
        )}
      </div>
      
      {isSupervisor ? (
        // Dashboard สำหรับหัวหน้าหน่วยงาน
        <div className="max-w-6xl mx-auto">
          {/* ปฏิทินสำหรับ Admin */}
          <div className="admin-calendar">
            <div className="calendar-container bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Header ปฏิทิน */}
              <div className="calendar-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">ปฏิทินเวรทีม</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => changeMonth('prev')}
                      className="calendar-nav-button p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="calendar-nav-text text-lg font-semibold">
                      {currentDate.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <button
                      onClick={() => changeMonth('next')}
                      className="calendar-nav-button p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ปฏิทิน */}
              <div className="p-1 sm:p-2 md:p-4 lg:p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="calendar-table w-full text-xs sm:text-sm min-w-full">
                      {/* หัวตาราง */}
                      <thead>
                        <tr className="border-b border-gray-200">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                            <th key={day} className="text-center py-3 text-gray-600 font-semibold">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generateCalendar().map((week, weekIndex) => (
                          <tr key={weekIndex} className="border-b border-gray-100">
                            {week.map((date, dayIndex) => {
                              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                              const isToday = date.toDateString() === new Date().toDateString();
                              const { topShift, bottomShift, topShiftStyle, bottomShiftStyle } = getStaffShifts(date);
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`p-0.5 sm:p-1 md:p-2 h-12 sm:h-16 md:h-20 lg:h-24 w-10 sm:w-12 md:w-16 lg:w-24 align-top ${
                                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                  <div className="flex flex-col h-full">
                                    {/* วันที่ */}
                                    <div className={`calendar-date text-xs font-medium mb-0.5 sm:mb-1 ${
                                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                    } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                                      {date.getDate()}
                                    </div>
                                    
                                    {/* เวรแถวบน */}
                                    {topShift && topShift.trim() !== '' && (
                                      <div 
                                        className={`calendar-shift text-xs px-0.5 py-0.5 rounded mb-0.5 sm:mb-1 ${
                                          typeof getShiftColor(topShift, topShiftStyle) === 'string' 
                                            ? getShiftColor(topShift, topShiftStyle) 
                                            : getShiftColor(topShift, topShiftStyle).className
                                        }`}
                                        style={typeof getShiftColor(topShift, topShiftStyle) === 'object' ? {
                                          backgroundColor: getShiftColor(topShift, topShiftStyle).backgroundColor,
                                          color: getShiftColor(topShift, topShiftStyle).color
                                        } : {}}
                                      >
                                        {getShiftName(topShift)}
                                      </div>
                                    )}
                                    
                                    {/* เวรแถวล่าง */}
                                    {bottomShift && bottomShift.trim() !== '' && (
                                      <div 
                                        className={`text-xs px-0.5 py-0.5 rounded ${
                                          typeof getShiftColor(bottomShift, bottomShiftStyle) === 'string' 
                                            ? getShiftColor(bottomShift, bottomShiftStyle) 
                                            : getShiftColor(bottomShift, bottomShiftStyle).className
                                        }`}
                                        style={typeof getShiftColor(bottomShift, bottomShiftStyle) === 'object' ? {
                                          backgroundColor: getShiftColor(bottomShift, bottomShiftStyle).backgroundColor,
                                          color: getShiftColor(bottomShift, bottomShiftStyle).color
                                        } : {}}
                                      >
                                        {getShiftName(bottomShift)}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Dashboard สำหรับตำแหน่งอื่นๆ - แสดงปฏิทิน
        <div className="max-w-6xl mx-auto">
          {/* ปฏิทิน */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header ปฏิทิน */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">ปฏิทินเวรของฉัน</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => changeMonth('prev')}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('th-TH', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  <button
                    onClick={() => changeMonth('next')}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ปฏิทิน */}
            <div className="p-1 sm:p-2 md:p-4 lg:p-6">

              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-full">
                    {/* หัวตาราง */}
                    <thead>
                      <tr className="border-b border-gray-200">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                          <th key={day} className="text-center py-3 text-gray-600 font-semibold">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generateCalendar().map((week, weekIndex) => (
                        <tr key={weekIndex} className="border-b border-gray-100">
                          {week.map((date, dayIndex) => {
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                            const isToday = date.toDateString() === new Date().toDateString();
                            const { topShift, bottomShift, topShiftStyle, bottomShiftStyle } = getStaffShifts(date);
                            
                            return (
                              <td 
                                key={dayIndex} 
                                className={`p-0.5 sm:p-1 md:p-2 h-12 sm:h-16 md:h-20 lg:h-24 w-10 sm:w-12 md:w-16 lg:w-24 align-top ${
                                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                              >
                                <div className="flex flex-col h-full">
                                  {/* วันที่ */}
                                  <div className={`text-xs font-medium mb-0.5 sm:mb-1 ${
                                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                                    {date.getDate()}
                                  </div>
                                  
                                  {/* เวรแถวบน */}
                                  {topShift && topShift.trim() !== '' && (
                                    <div 
                                      className={`text-xs px-0.5 py-0.5 rounded mb-0.5 sm:mb-1 ${
                                        typeof getShiftColor(topShift, topShiftStyle) === 'string' 
                                          ? getShiftColor(topShift, topShiftStyle) 
                                          : getShiftColor(topShift, topShiftStyle).className
                                      }`}
                                      style={typeof getShiftColor(topShift, topShiftStyle) === 'object' ? {
                                        backgroundColor: getShiftColor(topShift, topShiftStyle).backgroundColor,
                                        color: getShiftColor(topShift, topShiftStyle).color
                                      } : {}}
                                    >
                                      {getShiftName(topShift)}
                                    </div>
                                  )}
                                  
                                  {/* เวรแถวล่าง */}
                                  {bottomShift && bottomShift.trim() !== '' && (
                                    <div 
                                      className={`text-xs px-0.5 py-0.5 rounded ${
                                        typeof getShiftColor(bottomShift, bottomShiftStyle) === 'string' 
                                          ? getShiftColor(bottomShift, bottomShiftStyle) 
                                          : getShiftColor(bottomShift, bottomShiftStyle).className
                                      }`}
                                      style={typeof getShiftColor(bottomShift, bottomShiftStyle) === 'object' ? {
                                        backgroundColor: getShiftColor(bottomShift, bottomShiftStyle).backgroundColor,
                                        color: getShiftColor(bottomShift, bottomShiftStyle).color
                                      } : {}}
                                    >
                                      {getShiftName(bottomShift)}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>


        </div>
      )}
    </div>
  );
};

export default Dashboard;
