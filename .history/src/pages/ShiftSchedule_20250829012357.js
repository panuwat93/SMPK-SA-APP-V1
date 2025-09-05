import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShiftSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [cellValues, setCellValues] = useState({});
  const [shiftOptions, setShiftOptions] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'nurses', 'assistants'
  const inputRef = useRef(null);

  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
      fetchShiftOptions();
    }
  }, [userData]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team for department:', userData.department);
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        console.log('Team data:', teamData);
        const members = teamData.members || [];
        console.log('Team members:', members);
        setTeamMembers(members);
        setDebugInfo(`พบสมาชิกในทีม ${members.length} คน`);
      } else {
        console.log('No team document found');
        setDebugInfo('ไม่พบข้อมูลทีม');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setDebugInfo(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftOptions = async () => {
    try {
      const shiftOptionsRef = doc(db, 'shiftOptions', userData.department);
      const shiftOptionsDoc = await getDoc(shiftOptionsRef);
      
      if (shiftOptionsDoc.exists()) {
        const options = shiftOptionsDoc.data().options || [];
        setShiftOptions(options);
      }
    } catch (error) {
      console.error('Error fetching shift options:', error);
    }
  };

  // สร้างวันที่ในเดือน
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // อาทิตย์หรือเสาร์
      
      days.push({
        day,
        dayOfWeek: dayNames[dayOfWeek],
        isWeekend
      });
    }
    
    return days;
  };

  // แยกเจ้าหน้าที่ตามตำแหน่ง
  const nurses = teamMembers.filter(member => member.role === 'พยาบาล');
  const nursingAssistants = teamMembers.filter(member => member.role === 'ผู้ช่วยพยาบาล');
  const patientHelpers = teamMembers.filter(member => member.role === 'พนักงานผู้ช่วยเหลือคนไข้');
  const assistants = teamMembers.filter(member => 
    member.role === 'ผู้ช่วยพยาบาล' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้'
  );

  // นับเวรในแถวสรุป
  const countShiftsForDay = (dayIndex, memberList) => {
    const counts = {};
    
    // เริ่มต้นด้วย 0 สำหรับทุกเวรที่เปิด "นับในสรุป"
    shiftOptions.forEach(option => {
      if (option.includeInTeam) {
        counts[option.name] = 0;
      }
    });

    // นับเวรจากทุกคนในทีม
    memberList.forEach(member => {
      // นับจากแถวบน
      const topCellKey = `${member.id}-${dayIndex}-top`;
      const topValue = cellValues[topCellKey] || '';
      if (topValue && counts.hasOwnProperty(topValue)) {
        counts[topValue]++;
      }

      // นับจากแถวล่าง
      const bottomCellKey = `${member.id}-${dayIndex}-bottom`;
      const bottomValue = cellValues[bottomCellKey] || '';
      if (bottomValue && counts.hasOwnProperty(bottomValue)) {
        counts[bottomValue]++;
      }
    });

    return counts;
  };

  // หาสีของเวร
  const getShiftStyle = (shiftName) => {
    // ถ้าไม่มีข้อความ ไม่ต้องแสดงสี
    if (!shiftName || shiftName.trim() === '') {
      return {
        color: '#000000',
        backgroundColor: '#ffffff'
      };
    }
    
    const shiftOption = shiftOptions.find(option => option.name === shiftName);
    if (shiftOption) {
      return {
        color: shiftOption.textColor || '#000000',
        backgroundColor: shiftOption.backgroundColor || '#ffffff'
      };
    }
    
    // คำอื่นที่ไม่มีในตั้งค่าเวร (เช่น ประชุม, อบรม) = อักษรดำพื้นฟ้าอ่อน
    return {
      color: '#000000',
      backgroundColor: '#e0f2fe'
    };
  };

  // เปลี่ยนเดือน
  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  // เริ่มแก้ไขเซลล์
  const startEditing = (memberId, dayIndex, rowType = 'shift') => {
    const cellKey = `${memberId}-${dayIndex}-${rowType}`;
    setEditingCell(cellKey);
    setCellValues(prev => ({
      ...prev,
      [cellKey]: prev[cellKey] || ''
    }));
  };

  // บันทึกค่าเซลล์
  const saveCellValue = async (memberId, dayIndex, rowType = 'shift', value) => {
    const cellKey = `${memberId}-${dayIndex}-${rowType}`;
    setCellValues(prev => ({
      ...prev,
      [cellKey]: value
    }));
    setEditingCell(null);

    // บันทึกลง Firebase
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      
      await updateDoc(scheduleRef, {
        [`${memberId}.${dayIndex}.${rowType}`]: value
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  // จัดการการกดปุ่ม
  const handleKeyDown = (e, memberId, dayIndex, rowType = 'top') => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const value = e.target.value;
      saveCellValue(memberId, dayIndex, rowType, value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentCell = editingCell;
      if (!currentCell) return;

      const [currentMemberId, currentDayIndex, currentRowType] = currentCell.split('-');
      let newMemberId = currentMemberId;
      let newDayIndex = parseInt(currentDayIndex);
      let newRowType = currentRowType || 'top';

      if (e.key === 'ArrowUp') {
        // เลื่อนขึ้นไปแถวบนของคนเดียวกัน หรือไปคนก่อนหน้า
        if (currentRowType === 'bottom') {
          newRowType = 'top';
        } else {
          const currentMemberIndex = teamMembers.findIndex(m => m.id === currentMemberId);
          if (currentMemberIndex > 0) {
            newMemberId = teamMembers[currentMemberIndex - 1].id;
            newRowType = 'bottom';
          }
        }
      } else if (e.key === 'ArrowDown') {
        // เลื่อนลงไปแถวล่างของคนเดียวกัน หรือไปคนถัดไป
        if (currentRowType === 'top') {
          newRowType = 'bottom';
        } else {
          const currentMemberIndex = teamMembers.findIndex(m => m.id === currentMemberId);
          if (currentMemberIndex < teamMembers.length - 1) {
            newMemberId = teamMembers[currentMemberIndex + 1].id;
            newRowType = 'top';
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (newDayIndex > 0) {
          newDayIndex = newDayIndex - 1;
        }
      } else if (e.key === 'ArrowRight') {
        if (newDayIndex < days.length - 1) {
          newDayIndex = newDayIndex + 1;
        }
      }

      const newCellKey = `${newMemberId}-${newDayIndex}-${newRowType}`;
      setEditingCell(newCellKey);
      setCellValues(prev => ({
        ...prev,
        [newCellKey]: prev[newCellKey] || ''
      }));
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <div className="w-full">
        {/* หัวข้อและปุ่มเปลี่ยนเดือน */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">ตารางเวร</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xl font-semibold text-gray-700">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-center">แผนก: {userData?.department}</p>
          
          {/* ตัวเลือกการแสดงผลตารางเวร */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">แสดงตารางเวร:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="nurses">พยาบาลเท่านั้น</option>
                <option value="assistants">ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้เท่านั้น</option>
              </select>
            </div>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">ยังไม่มีสมาชิกในทีม</p>
            <p className="text-slate-500 text-sm mt-1">กรุณาตั้งค่าทีมในหน้า "ตั้งค่า" ก่อน</p>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/settings'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ไปหน้า Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ตารางพยาบาล */}
            {nurses.length > 0 && (viewMode === 'all' || viewMode === 'nurses') && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                <div className="bg-blue-100 text-blue-800 p-4 border-l-4 border-blue-400">
                  <h2 className="text-xl font-semibold text-center">พยาบาล ({nurses.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurses.map((nurse, index) => (
                        <React.Fragment key={nurse.id}>
                          {/* แถวที่ 1: ช่องเวรบน */}
                          <tr className="h-8">
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium align-middle">
                              {nurse.firstName} {nurse.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${nurse.id}-${dayIndex}-top`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${day.isWeekend ? 'bg-yellow-50' : ''}`}
                                  onClick={() => startEditing(nurse.id, dayIndex, 'top')}
                                >
                                  {isEditing ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, nurse.id, dayIndex, 'top')}
                                      onBlur={() => saveCellValue(nurse.id, dayIndex, 'top', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                          </tr>
                          {/* แถวที่ 2: ช่องเวรล่าง */}
                          <tr className="h-8 border-b-2 border-gray-400">
                            {days.map((day, dayIndex) => {
                              const cellKey = `${nurse.id}-${dayIndex}-bottom`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${day.isWeekend ? 'bg-yellow-50' : ''}`}
                                  onClick={() => startEditing(nurse.id, dayIndex, 'bottom')}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, nurse.id, dayIndex, 'bottom')}
                                      onBlur={() => saveCellValue(nurse.id, dayIndex, 'bottom', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-blue-50 text-blue-800 border-t-2 border-blue-200">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป พยาบาล
                        </td>
                        {days.map((day, dayIndex) => {
                          const shiftCounts = countShiftsForDay(dayIndex, nurses);
                          return (
                            <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                              {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                <div key={shiftName}>{shiftName}:{count}</div>
                              ))}
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ตารางผู้ช่วยพยาบาลและผู้ช่วยเหลือคนไข้ */}
            {assistants.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-400">
                  <h2 className="text-xl font-semibold text-center">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้ ({assistants.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-xl border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map((assistant, index) => (
                        <React.Fragment key={assistant.id}>
                          {/* แถวที่ 1: ชื่อ */}
                          <tr className="h-8">
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium align-middle">
                              {assistant.firstName} {assistant.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${assistant.id}-${dayIndex}-top`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${day.isWeekend ? 'bg-yellow-50' : ''}`}
                                  onClick={() => startEditing(assistant.id, dayIndex, 'top')}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, assistant.id, dayIndex, 'top')}
                                      onBlur={() => saveCellValue(assistant.id, dayIndex, 'top', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                          </tr>
                          {/* แถวที่ 2: ช่องเวรล่าง */}
                          <tr className="h-8 border-b-2 border-gray-400">
                            {days.map((day, dayIndex) => {
                              const cellKey = `${assistant.id}-${dayIndex}-bottom`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${day.isWeekend ? 'bg-yellow-50' : ''}`}
                                  onClick={() => startEditing(assistant.id, dayIndex, 'bottom')}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, assistant.id, dayIndex, 'bottom')}
                                      onBlur={() => saveCellValue(assistant.id, dayIndex, 'bottom', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-green-50 text-green-800 border-t-2 border-green-200">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้
                        </td>
                        {days.map((day, dayIndex) => {
                          const shiftCounts = countShiftsForDay(dayIndex, assistants);
                          return (
                            <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                              {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                <div key={shiftName}>{shiftName}:{count}</div>
                              ))}
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftSchedule;
