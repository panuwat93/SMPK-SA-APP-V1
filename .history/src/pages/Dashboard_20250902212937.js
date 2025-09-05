import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Dashboard = ({ user }) => {
  const isSupervisor = user?.role === 'หัวหน้าหน่วยงาน';
  
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
      case 'MB': return 'bg-blue-100 text-blue-800'; // สีน้ำเงิน
      case 'VA': return 'bg-white text-gray-600'; // สีขาว
      case 'O': return 'bg-white text-gray-600'; // สีขาว
      case 'ประชุม': return 'bg-white text-gray-600'; // สีขาว
      case 'ช*': return 'bg-white text-gray-600'; // สีขาว
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          ยินดีต้อนรับ
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          {isSupervisor 
            ? 'ระบบจัดการตารางเวรและคำนวณเงิน สำหรับหัวหน้าหน่วยงาน' 
            : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'ยินดีต้อนรับ'
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
        // Dashboard สำหรับตำแหน่งอื่นๆ - แสดงปฏิทิน
        <div className="max-w-6xl mx-auto">
          {/* ปฏิทิน */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header ปฏิทิน */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">ปฏิทินเวรของฉัน</h2>
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
            <div className="p-6">

              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
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
                                className={`p-2 h-24 w-24 align-top ${
                                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                              >
                                <div className="flex flex-col h-full">
                                  {/* วันที่ */}
                                  <div className={`text-sm font-medium mb-1 ${
                                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                                    {date.getDate()}
                                  </div>
                                  
                                  {/* เวรแถวบน */}
                                  {topShift && topShift.trim() !== '' && (
                                    <div 
                                      className={`text-xs px-1 py-0.5 rounded mb-1 ${
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
                                      className={`text-xs px-1 py-0.5 rounded ${
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
