import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const PreviousSchedule = ({ userData }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [holidays, setHolidays] = useState([]);
  const [overviewData, setOverviewData] = useState(null);

  // โหลดข้อมูลทีม
  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
      fetchShiftOptions();
    }
  }, [userData]);

  // โหลดตารางเวรก่อนแลกทั้งหมด
  useEffect(() => {
    if (userData?.department) {
      fetchSchedules();
    }
  }, [userData?.department]);

  // โหลดข้อมูลวันหยุดเมื่อเปลี่ยนเดือน
  useEffect(() => {
    if (selectedMonth) {
      loadHolidaysFromFirebase();
      loadOverviewData();
    }
  }, [selectedMonth]);

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
      console.error('Error fetching team:', error);
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

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const schedulesRef = collection(db, 'schedulesBeforeExchange');
      const q = query(schedulesRef, where('department', '==', userData.department));
      const querySnapshot = await getDocs(q);
      
      const schedulesList = [];
      querySnapshot.forEach((doc) => {
        schedulesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // เรียงลำดับตามเดือน (ใหม่สุดก่อน)
      schedulesList.sort((a, b) => {
        const monthA = new Date(a.monthKey.split('-')[0], parseInt(a.monthKey.split('-')[1]) - 1);
        const monthB = new Date(b.monthKey.split('-')[0], parseInt(b.monthKey.split('-')[1]) - 1);
        return monthB - monthA;
      });
      
      setSchedules(schedulesList);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลวันหยุดจาก Firebase
  const loadHolidaysFromFirebase = async () => {
    if (!selectedMonth) return;
    
    try {
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]);
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      const holidaysRef = doc(db, 'holidays', `${userData.department}-${monthKey}`);
      const holidaysDoc = await getDoc(holidaysRef);
      
      if (holidaysDoc.exists()) {
        const holidaysData = holidaysDoc.data();
        setHolidays(holidaysData.dates || []);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
      setHolidays([]);
    }
  };

  // โหลดข้อมูลภาพรวม
  const loadOverviewData = async () => {
    if (!selectedMonth) return;
    
    try {
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]);
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      const overviewRef = doc(db, 'schedulesBeforeExchange', `${userData.department}-${monthKey}-overview`);
      const overviewDoc = await getDoc(overviewRef);
      
      if (overviewDoc.exists()) {
        setOverviewData(overviewDoc.data());
      } else {
        setOverviewData(null);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
      setOverviewData(null);
    }
  };

  // แปลงเดือนเป็นภาษาไทย
  const getMonthName = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  // สร้างตารางวันในเดือน
  const getDaysInMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(parseInt(year), parseInt(month) - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      
      days.push({
        day: day,
        dayOfWeek: dayNames[date.getDay()],
        isWeekend: isWeekend
      });
    }
    
    return days;
  };

  // คำนวณสรุปเวร
  const countShiftsForDay = (dayIndex, members) => {
    if (!currentSchedule || !currentSchedule.schedule) return {};
    
    const shiftCounts = {};
    
    members.forEach(member => {
      const topShift = currentSchedule.schedule[member.id]?.[dayIndex]?.shift || '';
      const bottomShift = currentSchedule.schedule[member.id]?.[dayIndex]?.shift || '';
      
      if (topShift && shiftOptions.some(option => option.name === topShift && option.includeInTeam)) {
        shiftCounts[topShift] = (shiftCounts[topShift] || 0) + 1;
      }
      if (bottomShift && shiftOptions.some(option => option.name === bottomShift && option.includeInTeam)) {
        shiftCounts[bottomShift] = (shiftCounts[bottomShift] || 0) + 1;
      }
    });
    
    return shiftCounts;
  };

  // สไตล์ของเวร
  const getShiftStyle = (shiftValue) => {
    if (!shiftValue) return {};
    
    const shiftOption = shiftOptions.find(option => option.name === shiftValue);
    if (shiftOption) {
      return {
        color: shiftOption.textColor || '#000000',
        backgroundColor: shiftOption.backgroundColor || '#e0f2fe'
      };
    }
    
    // สำหรับเวรที่ไม่ได้กำหนดในตัวเลือก
    return {
      color: '#000000',
      backgroundColor: '#e0f2fe'
    };
  };

  // ตรวจสอบว่าเป็นวันหยุดหรือไม่
  const isHoliday = (day) => {
    if (!day) return false;
    return holidays.includes(day);
  };

  // กรองสมาชิกตามตำแหน่ง
  const nurses = teamMembers.filter(member => member.position === 'พยาบาล');
  const assistants = teamMembers.filter(member => 
    member.position === 'ผู้ช่วยพยาบาล' || member.position === 'พนักงานผู้ช่วยเหลือคนไข้'
  );

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
        {/* หัวข้อและเมนู */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="grid grid-cols-3 items-center mb-4">
            <div className="flex justify-start gap-3">
              {/* ไม่มีปุ่มบันทึก */}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 text-center">ตารางเวรก่อนแลก</h1>
            
            <div className="flex items-center gap-4 justify-end">
              {/* เลือกการแสดงผลตารางเวร */}
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
          
          {/* ตัวเลือกการแสดงผลตารางเวร */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">จำนวนวันทำการ:</span> {holidays.length > 0 ? 31 - holidays.length : 31} วัน
            </div>
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

        {schedules.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีตารางเวรก่อนแลก</h3>
            <p className="text-gray-500">ยังไม่มีการบันทึกตารางเวรก่อนแลกในระบบ</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* รายการเดือน */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedMonth === schedule.monthKey
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedMonth(schedule.monthKey);
                    setCurrentSchedule(schedule);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getMonthName(schedule.monthKey)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {schedule.savedAt?.toDate?.()?.toLocaleDateString('th-TH') || 'ไม่ระบุวันที่'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>บันทึกโดย: {schedule.savedBy || 'ไม่ระบุ'}</p>
                      <p>สถานะ: <span className="text-green-600 font-medium">อ่านอย่างเดียว</span></p>
                      {schedule.type === 'overview' && (
                        <p className="text-purple-600 font-medium">ภาพรวม: {schedule.overviewType === 'nurses' ? 'พยาบาล' : 'ผู้ช่วย'}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* แสดงตารางเวรที่เลือก */}
            {selectedMonth && currentSchedule && (
              <div className="space-y-8">
                {/* แสดงภาพรวมถ้ามี */}
                {overviewData && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-200/50 overflow-hidden">
                    <div className="bg-purple-100 text-purple-800 p-4 border-l-4 border-purple-400">
                      <h2 className="text-xl font-semibold text-center">
                        ภาพรวมตารางเวร - {overviewData.overviewType === 'nurses' ? 'พยาบาล' : 'ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้'}
                      </h2>
                      <p className="text-center text-sm mt-1">
                        บันทึกเมื่อ: {overviewData.savedAt?.toDate?.()?.toLocaleDateString('th-TH') || 'ไม่ระบุวันที่'}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-center text-gray-600">
                        ข้อมูลภาพรวมตารางเวรที่บันทึกไว้จากหน้า ShiftSchedule
                      </p>
                    </div>
                  </div>
                )}

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
                            {getDaysInMonth(selectedMonth).map((day, index) => (
                              <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${
                                isHoliday(day?.day) ? 'bg-orange-100' : 
                                day?.isWeekend ? 'bg-yellow-100' : ''
                              }`}>
                                {day ? (
                                  <>
                                    <div className="text-sm font-medium">{day.day}</div>
                                    <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                                  </>
                                ) : (
                                  <div className="h-8"></div>
                                )}
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
                                {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                                  if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                                  
                                  const cellValue = currentSchedule.schedule[nurse.id]?.[dayIndex]?.shift || '';
                                  
                                  return (
                                    <td 
                                      key={dayIndex} 
                                      className={`border border-gray-300 px-1 py-1 text-center ${
                                        isHoliday(day.day) ? 'bg-orange-50' : 
                                        day.isWeekend ? 'bg-yellow-50' : ''
                                      }`}
                                    >
                                      <span 
                                        className="text-sm font-medium px-1 py-0.5 rounded"
                                        style={getShiftStyle(cellValue)}
                                      >
                                        {cellValue}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                              </tr>
                              {/* แถวที่ 2: ช่องเวรล่าง */}
                              <tr className="h-8 border-b-2 border-gray-400">
                                {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                                  if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                                  
                                  const cellValue = currentSchedule.schedule[nurse.id]?.[dayIndex]?.shift || '';
                                  
                                  return (
                                    <td 
                                      key={dayIndex} 
                                      className={`border border-gray-300 px-1 py-1 text-center ${
                                        isHoliday(day.day) ? 'bg-orange-50' : 
                                        day.isWeekend ? 'bg-yellow-50' : ''
                                      }`}
                                    >
                                      <span 
                                        className="text-sm font-medium px-1 py-0.5 rounded"
                                        style={getShiftStyle(cellValue)}
                                      >
                                        {cellValue}
                                      </span>
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
                            {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                              if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                              
                              const shiftCounts = countShiftsForDay(dayIndex, nurses);
                              return (
                                <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                                  {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                    <div key={shiftName}>{shiftName}:{count}</div>
                                  ))}
                                  {Object.keys(shiftCounts).length === 0 && <div>ช:0</div>}
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
                {assistants.length > 0 && (viewMode === 'all' || viewMode === 'assistants') && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-green-200/50 overflow-hidden">
                    <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-400">
                      <h2 className="text-xl font-semibold text-center">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้ ({assistants.length} คน)</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-xl border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                            <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                            {getDaysInMonth(selectedMonth).map((day, index) => (
                              <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${
                                isHoliday(day?.day) ? 'bg-orange-100' : 
                                day?.isWeekend ? 'bg-yellow-100' : ''
                              }`}>
                                {day ? (
                                  <>
                                    <div className="text-sm font-medium">{day.day}</div>
                                    <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                                  </>
                                ) : (
                                  <div className="h-8"></div>
                                )}
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
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium align-middle">
                                  {assistant.firstName} {assistant.lastName}
                                </td>
                                {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                                  if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                                  
                                  const cellValue = currentSchedule.schedule[assistant.id]?.[dayIndex]?.shift || '';
                                  
                                  return (
                                    <td 
                                      key={dayIndex} 
                                      className={`border border-gray-300 px-1 py-1 text-center ${
                                        isHoliday(day.day) ? 'bg-orange-50' : 
                                        day.isWeekend ? 'bg-yellow-50' : ''
                                      }`}
                                    >
                                      <span 
                                        className="text-sm font-medium px-1 py-0.5 rounded"
                                        style={getShiftStyle(cellValue)}
                                      >
                                        {cellValue}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                                <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">-</td>
                              </tr>
                              {/* แถวที่ 2: เวร */}
                              <tr className="h-8 border-b-2 border-gray-400">
                                {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                                  if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                                  
                                  const cellValue = currentSchedule.schedule[assistant.id]?.[dayIndex]?.shift || '';
                                  
                                  return (
                                    <td 
                                      key={dayIndex} 
                                      className={`border border-gray-300 px-1 py-1 text-center ${
                                        isHoliday(day.day) ? 'bg-orange-50' : 
                                        day.isWeekend ? 'bg-yellow-50' : ''
                                      }`}
                                    >
                                      <span 
                                        className="text-sm font-medium px-1 py-0.5 rounded"
                                        style={getShiftStyle(cellValue)}
                                      >
                                        {cellValue}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            </React.Fragment>
                          ))}
                          {/* แถวสรุป */}
                          <tr className="bg-green-50 text-green-800 border-t-2 border-green-200">
                            <td colSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                              สรุป ผู้ช่วยพยาบาล
                            </td>
                            {getDaysInMonth(selectedMonth).map((day, dayIndex) => {
                              if (!day) return <td key={dayIndex} className="border border-gray-300"></td>;
                              
                              const shiftCounts = countShiftsForDay(dayIndex, assistants);
                              return (
                                <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                                  {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                    <div key={shiftName}>{shiftName}:{count}</div>
                                  ))}
                                  {Object.keys(shiftCounts).length === 0 && <div>ช:0</div>}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousSchedule;
