import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const OncallSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [cellValues, setCellValues] = useState({});
  const [shiftOptions, setShiftOptions] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'nurses', 'assistants'
  const [holidays, setHolidays] = useState([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ dates: [] });
  const [holidayMessage, setHolidayMessage] = useState({ text: '', type: '' }); // 'success', 'error', 'info'
  const [permissions, setPermissions] = useState({});
  const [canEditSchedule, setCanEditSchedule] = useState(false);
  
  // แถบเครื่องมือ
  const [selectedCell, setSelectedCell] = useState(null); // ช่องที่เลือก
  const [selectedCells, setSelectedCells] = useState([]); // ช่องที่เลือกหลายช่อง
  const [textColor, setTextColor] = useState('#000000'); // สีตัวอักษร (ดำ)
  const [fontSize, setFontSize] = useState(14); // ขนาดตัวอักษร
  const [history, setHistory] = useState([]); // ประวัติการเปลี่ยนแปลง (เก็บ 5 ครั้ง)
  const [isScheduleSaved, setIsScheduleSaved] = useState(false); // สถานะการบันทึกตารางเวร
  
  // โหมดภาพรวม
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [overviewType, setOverviewType] = useState('nurses'); // 'nurses', 'assistants'
  const [overviewImage, setOverviewImage] = useState(null);
  
  const inputRef = useRef(null);

  const isSupervisor = userData?.role === 'หัวหน้าหน่วยงาน';

  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
      fetchShiftOptions();
      fetchPermissions();
      // โหลดข้อมูลวันหยุดจาก Firebase เมื่อเริ่มต้น
      loadHolidaysFromFirebase();
      // โหลดข้อมูลตารางเวรจาก Firebase เมื่อเริ่มต้น
      loadScheduleFromFirebase();
    }
  }, [userData]);

  // โหลดข้อมูลตารางเวรเมื่อเปลี่ยนเดือน
  useEffect(() => {
    if (userData?.department && teamMembers.length > 0) {
      loadScheduleFromFirebase();
    }
  }, [currentMonth, userData, teamMembers]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const fetchTeamMembers = async () => {
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const members = teamData.members || [];
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchShiftOptions = async () => {
    try {
      const settingsRef = doc(db, 'settings', userData.department);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        setShiftOptions(settingsData.shiftOptions || []);
      }
    } catch (error) {
      console.error('Error fetching shift options:', error);
    }
  };

  const loadScheduleFromFirebase = async (targetDate = currentMonth) => {
    try {
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'oncallSchedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        console.log('Loaded oncall schedule data:', scheduleData);
        
        // แปลงข้อมูลจาก Firebase เป็น cellValues format
        const newCellValues = {};
        if (scheduleData.schedule) {
          Object.keys(scheduleData.schedule).forEach(memberId => {
            Object.keys(scheduleData.schedule[memberId]).forEach(dayIndex => {
              Object.keys(scheduleData.schedule[memberId][dayIndex]).forEach(rowType => {
                const cellKey = `${memberId}-${dayIndex}-${rowType}`;
                newCellValues[cellKey] = scheduleData.schedule[memberId][dayIndex][rowType];
              });
            });
          });
        }
        
        setCellValues(newCellValues);
        console.log('Updated cellValues:', newCellValues);
        
        // โหลดข้อมูลสไตล์ (สีและขนาดตัวอักษร) ถ้ามี
        if (scheduleData.cellStyles) {
          setCellStyles(scheduleData.cellStyles);
          console.log('Updated cellStyles:', scheduleData.cellStyles);
        }
        
        // ตั้งสถานะว่าตารางเวรถูกบันทึกแล้ว
        setIsScheduleSaved(true);
      } else {
        console.log('No oncall schedule data found for month:', monthKey);
        setCellValues({});
        setIsScheduleSaved(false);
      }
    } catch (error) {
      console.error('Error loading oncall schedule:', error);
      setCellValues({});
      setIsScheduleSaved(false);
    }
  };

  const saveScheduleToFirebase = async () => {
    if (!isSupervisor) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขตารางเวร');
      return;
    }

    setLoading(true);
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'oncallSchedules', `${userData.department}-${monthKey}`);
      
      // แปลง cellValues กลับเป็น nested structure
      const scheduleData = {};
      Object.keys(cellValues).forEach(cellKey => {
        const [memberId, dayIndex, rowType] = cellKey.split('-');
        if (!scheduleData[memberId]) {
          scheduleData[memberId] = {};
        }
        if (!scheduleData[memberId][dayIndex]) {
          scheduleData[memberId][dayIndex] = {};
        }
        scheduleData[memberId][dayIndex][rowType] = cellValues[cellKey];
      });

      await setDoc(scheduleRef, {
        schedule: scheduleData,
        cellStyles: cellStyles,
        monthKey: monthKey,
        updatedAt: new Date(),
        updatedBy: userData.uid,
        department: userData.department
      });

      setIsScheduleSaved(true);
      alert('บันทึกตารางเวร Oncall เรียบร้อย');
    } catch (error) {
      console.error('Error saving oncall schedule:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (cellKey, currentValue, currentStyle) => {
    if (!isSupervisor) {
      return; // ไม่ให้แก้ไขถ้าไม่ใช่หัวหน้า
    }
    setEditingCell(cellKey);
    setEditingValue(currentValue || '');
    setEditingStyle(currentStyle || {});
  };

  const saveCellValue = () => {
    if (!isSupervisor) {
      return; // ไม่ให้แก้ไขถ้าไม่ใช่หัวหน้า
    }

    if (editingCell) {
      setCellValues(prev => ({
        ...prev,
        [editingCell]: editingValue
      }));
      
      setCellStyles(prev => ({
        ...prev,
        [editingCell]: editingStyle
      }));
      
      setEditingCell(null);
      setEditingValue('');
      setEditingStyle({});
      setIsScheduleSaved(false);
    }
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
    setEditingStyle({});
  };

  const getShiftColor = (shift, cellStyle) => {
    if (!shift || shift.trim() === '') {
      return { className: 'text-gray-500', backgroundColor: 'transparent', color: '#6B7280' };
    }

    // หาสีจาก shiftOptions ก่อน
    const shiftOption = shiftOptions.find(option => option.name === shift);
    if (shiftOption) {
      return {
        className: '',
        backgroundColor: shiftOption.backgroundColor || '#F3F4F6',
        color: shiftOption.textColor || '#374151'
      };
    }

    // สำหรับ ช/บ/ด ให้ใช้สีจาก cellStyle
    if (['ช', 'บ', 'ด'].includes(shift)) {
      return {
        className: '',
        backgroundColor: cellStyle.backgroundColor || '#F3F4F6',
        color: cellStyle.textColor || '#374151'
      };
    }

    // สีเริ่มต้น
    return { className: 'text-gray-500', backgroundColor: 'transparent', color: '#6B7280' };
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // เพิ่มวันว่างสำหรับวันแรกของเดือน
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // เพิ่มวันในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatMonthYear = (date) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const generateOverview = () => {
    const overview = {};
    const daysInMonth = getDaysInMonth(currentMonth).filter(day => day !== null);
    
    teamMembers.forEach(member => {
      overview[member.id] = {
        name: `${member.firstName} ${member.lastName}`,
        totalShifts: 0,
        shifts: {}
      };
      
      daysInMonth.forEach((day, dayIndex) => {
        const topKey = `${member.id}-${dayIndex}-top`;
        const bottomKey = `${member.id}-${dayIndex}-bottom`;
        const topShift = cellValues[topKey] || '';
        const bottomShift = cellValues[bottomKey] || '';
        
        if (topShift || bottomShift) {
          overview[member.id].shifts[dayIndex] = { top: topShift, bottom: bottomShift };
          if (topShift) overview[member.id].totalShifts++;
          if (bottomShift) overview[member.id].totalShifts++;
        }
      });
    });
    
    setOverviewData(overview);
    setShowOverview(true);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const days = daysInMonth.filter(day => day !== null);

  // แยกสมาชิกตามตำแหน่ง
  const nurses = teamMembers.filter(member => member.role === 'พยาบาล');
  const assistants = teamMembers.filter(member => 
    member.role === 'ผู้ช่วยพยาบาล' || 
    member.role === 'ผู้ช่วยเหลือคนไข้' || 
    member.role === 'พนักงานผู้ช่วยเหลือคนไข้'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              ตารางเวร Oncall
            </h1>
            <p className="text-gray-600">
              จัดการตารางเวร Oncall สำหรับแผนก {userData.department}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Month Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-lg font-semibold text-gray-800 min-w-[200px] text-center">
                {formatMonthYear(currentMonth)}
              </h2>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={generateOverview}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ภาพรวม
              </button>
              
              {isSupervisor && (
                <button
                  onClick={saveScheduleToFirebase}
                  disabled={loading || isScheduleSaved}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isScheduleSaved
                      ? 'bg-green-600 text-white'
                      : loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : isScheduleSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Permission Notice for Non-Supervisors */}
        {!isSupervisor && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-800 font-medium">
                คุณกำลังดูตารางเวร Oncall ในโหมดดูอย่างเดียว - ไม่สามารถแก้ไขได้
              </p>
            </div>
          </div>
        )}

        {/* Schedule Tables */}
        <div className="space-y-8">
          {/* Nurses Table */}
          {nurses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-semibold">พยาบาล</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 top-0 bg-gray-50 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">
                        No.
                      </th>
                      <th className="sticky left-10 top-0 bg-gray-50 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">
                        ชื่อ-นามสกุล
                      </th>
                      {days.map((day, index) => (
                        <th key={index} className="sticky top-0 bg-gray-50 z-20 px-2 py-3 text-center text-sm font-semibold text-gray-800 border-r border-gray-200">
                          <div>{day.getDate()}</div>
                          <div className="text-xs text-gray-500">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.getDay()]}
                          </div>
                        </th>
                      ))}
                      <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-center text-sm font-semibold text-gray-800">
                        เวรรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {nurses.map((member, memberIndex) => {
                      const totalShifts = days.reduce((total, day, dayIndex) => {
                        const topKey = `${member.id}-${dayIndex}-top`;
                        const bottomKey = `${member.id}-${dayIndex}-bottom`;
                        const topShift = cellValues[topKey] || '';
                        const bottomShift = cellValues[bottomKey] || '';
                        return total + (topShift ? 1 : 0) + (bottomShift ? 1 : 0);
                      }, 0);

                      return (
                        <React.Fragment key={member.id}>
                          {/* Top Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                              {memberIndex + 1}
                            </td>
                            <td className="sticky left-10 bg-white z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                              {member.firstName} {member.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${member.id}-${dayIndex}-top`;
                              const cellValue = cellValues[cellKey] || '';
                              const cellStyle = cellStyles[cellKey] || {};
                              const shiftColor = getShiftColor(cellValue, cellStyle);

                              return (
                                <td key={dayIndex} className="px-2 py-3 text-center border-r border-gray-200">
                                  {editingCell === cellKey ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellValue();
                                          if (e.key === 'Escape') cancelEditing();
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditing(cellKey, cellValue, cellStyle)}
                                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                        isSupervisor ? 'hover:bg-gray-100' : 'cursor-default'
                                      }`}
                                      style={{
                                        backgroundColor: shiftColor.backgroundColor,
                                        color: shiftColor.color
                                      }}
                                    >
                                      {cellValue}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                              {totalShifts}
                            </td>
                          </tr>

                          {/* Bottom Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                            </td>
                            <td className="sticky left-10 bg-white z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${member.id}-${dayIndex}-bottom`;
                              const cellValue = cellValues[cellKey] || '';
                              const cellStyle = cellStyles[cellKey] || {};
                              const shiftColor = getShiftColor(cellValue, cellStyle);

                              return (
                                <td key={dayIndex} className="px-2 py-3 text-center border-r border-gray-200">
                                  {editingCell === cellKey ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellValue();
                                          if (e.key === 'Escape') cancelEditing();
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditing(cellKey, cellValue, cellStyle)}
                                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                        isSupervisor ? 'hover:bg-gray-100' : 'cursor-default'
                                      }`}
                                      style={{
                                        backgroundColor: shiftColor.backgroundColor,
                                        color: shiftColor.color
                                      }}
                                    >
                                      {cellValue}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assistants Table */}
          {assistants.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h3 className="text-xl font-semibold">ผู้ช่วย</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 top-0 bg-gray-50 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">
                        No.
                      </th>
                      <th className="sticky left-10 top-0 bg-gray-50 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">
                        ชื่อ-นามสกุล
                      </th>
                      {days.map((day, index) => (
                        <th key={index} className="sticky top-0 bg-gray-50 z-20 px-2 py-3 text-center text-sm font-semibold text-gray-800 border-r border-gray-200">
                          <div>{day.getDate()}</div>
                          <div className="text-xs text-gray-500">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.getDay()]}
                          </div>
                        </th>
                      ))}
                      <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-center text-sm font-semibold text-gray-800">
                        เวรรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assistants.map((member, memberIndex) => {
                      const totalShifts = days.reduce((total, day, dayIndex) => {
                        const topKey = `${member.id}-${dayIndex}-top`;
                        const bottomKey = `${member.id}-${dayIndex}-bottom`;
                        const topShift = cellValues[topKey] || '';
                        const bottomShift = cellValues[bottomKey] || '';
                        return total + (topShift ? 1 : 0) + (bottomShift ? 1 : 0);
                      }, 0);

                      return (
                        <React.Fragment key={member.id}>
                          {/* Top Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                              {memberIndex + 1}
                            </td>
                            <td className="sticky left-10 bg-white z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                              {member.firstName} {member.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${member.id}-${dayIndex}-top`;
                              const cellValue = cellValues[cellKey] || '';
                              const cellStyle = cellStyles[cellKey] || {};
                              const shiftColor = getShiftColor(cellValue, cellStyle);

                              return (
                                <td key={dayIndex} className="px-2 py-3 text-center border-r border-gray-200">
                                  {editingCell === cellKey ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellValue();
                                          if (e.key === 'Escape') cancelEditing();
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditing(cellKey, cellValue, cellStyle)}
                                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                        isSupervisor ? 'hover:bg-gray-100' : 'cursor-default'
                                      }`}
                                      style={{
                                        backgroundColor: shiftColor.backgroundColor,
                                        color: shiftColor.color
                                      }}
                                    >
                                      {cellValue}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                              {totalShifts}
                            </td>
                          </tr>

                          {/* Bottom Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                            </td>
                            <td className="sticky left-10 bg-white z-10 px-4 py-3 text-sm text-gray-800 border-r border-gray-200">
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${member.id}-${dayIndex}-bottom`;
                              const cellValue = cellValues[cellKey] || '';
                              const cellStyle = cellStyles[cellKey] || {};
                              const shiftColor = getShiftColor(cellValue, cellStyle);

                              return (
                                <td key={dayIndex} className="px-2 py-3 text-center border-r border-gray-200">
                                  {editingCell === cellKey ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellValue();
                                          if (e.key === 'Escape') cancelEditing();
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditing(cellKey, cellValue, cellStyle)}
                                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                        isSupervisor ? 'hover:bg-gray-100' : 'cursor-default'
                                      }`}
                                      style={{
                                        backgroundColor: shiftColor.backgroundColor,
                                        color: shiftColor.color
                                      }}
                                    >
                                      {cellValue}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Overview Modal */}
        {showOverview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-blue-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">ภาพรวมตารางเวร Oncall</h3>
                  <button
                    onClick={() => setShowOverview(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  {Object.keys(overviewData).map(memberId => {
                    const member = overviewData[memberId];
                    return (
                      <div key={memberId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-800">{member.name}</h4>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            เวรรวม: {member.totalShifts}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-2">
                          {days.map((day, dayIndex) => {
                            const dayShifts = member.shifts[dayIndex];
                            return (
                              <div key={dayIndex} className="text-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  {day.getDate()}
                                </div>
                                <div className="space-y-1">
                                  {dayShifts ? (
                                    <>
                                      {dayShifts.top && (
                                        <div 
                                          className="px-1 py-0.5 rounded text-xs font-medium"
                                          style={{
                                            backgroundColor: getShiftColor(dayShifts.top, {}).backgroundColor,
                                            color: getShiftColor(dayShifts.top, {}).color
                                          }}
                                        >
                                          {dayShifts.top}
                                        </div>
                                      )}
                                      {dayShifts.bottom && (
                                        <div 
                                          className="px-1 py-0.5 rounded text-xs font-medium"
                                          style={{
                                            backgroundColor: getShiftColor(dayShifts.bottom, {}).backgroundColor,
                                            color: getShiftColor(dayShifts.bottom, {}).color
                                          }}
                                        >
                                          {dayShifts.bottom}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-xs text-gray-400">-</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OncallSchedule;
