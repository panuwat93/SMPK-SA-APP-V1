import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const PreviousSchedule = ({ userData }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'nurses', 'assistants'
  const [holidays, setHolidays] = useState([]);

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
    const firstDayOfWeek = new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
    
    const days = [];
    
    // เพิ่มวันว่างก่อนวันแรกของเดือน
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // เพิ่มวันในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // คำนวณสรุปเวร
  const calculateShiftSummary = (schedule) => {
    if (!schedule || !schedule.schedule) return {};
    
    const summary = {};
    
    // วนลูปผ่านทุกวัน
    Object.keys(schedule.schedule).forEach(memberId => {
      Object.keys(schedule.schedule[memberId]).forEach(dayIndex => {
        const shiftData = schedule.schedule[memberId][dayIndex];
        const shiftValue = shiftData?.shift || '';
        
        if (!summary[dayIndex]) {
          summary[dayIndex] = { ช: 0, บ: 0, ด: 0 };
        }
        
        // นับเวรตามที่ตั้งค่าไว้
        if (shiftValue === 'ช') summary[dayIndex].ช++;
        else if (shiftValue === 'บ') summary[dayIndex].บ++;
        else if (shiftValue === 'ด') summary[dayIndex].ด++;
      });
    });
    
    return summary;
  };

  // ตรวจสอบว่าเป็นวันหยุดหรือไม่
  const isHoliday = (day) => {
    if (!day) return false;
    return holidays.includes(day);
  };

  // ตรวจสอบว่าเป็นวันสุดสัปดาห์หรือไม่
  const isWeekend = (day) => {
    if (!day) return false;
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  // แสดงตารางเวรแบบเดียวกับหน้าหลัก
  const renderScheduleTable = (schedule) => {
    const days = getDaysInMonth(schedule.monthKey);
    const shiftSummary = calculateShiftSummary(schedule);
    
    // กรองสมาชิกตาม viewMode
    const filteredMembers = teamMembers.filter(member => {
      if (viewMode === 'nurses') return member.position === 'พยาบาล';
      if (viewMode === 'assistants') return member.position === 'ผู้ช่วยพยาบาล' || member.position === 'พนักงานผู้ช่วยเหลือคนไข้';
      return true;
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-10">ลำดับ</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
              {days.map((day, index) => (
                <th key={index} className="border border-gray-300 px-1 py-2 text-xs font-medium text-gray-700 w-10">
                  {day || ''}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-16">เวรรวม</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-16">OT</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-16">ค่าเวร</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member, memberIndex) => (
              <React.Fragment key={member.id}>
                {/* แถวชื่อและตำแหน่ง */}
                <tr className="bg-gray-100">
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">
                    {memberIndex + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                    {member.name}
                    <br />
                    <span className="text-gray-500">{member.position}</span>
                  </td>
                  {days.map((day, dayIndex) => (
                    <td key={dayIndex} className="border border-gray-300 px-1 py-1 text-xs text-gray-600 text-center">
                      {day ? (
                        <div className="min-h-[2rem] flex items-center justify-center">
                          {/* แสดงข้อมูลเวรถ้ามี */}
                          {schedule.schedule[member.id]?.[dayIndex]?.shift || ''}
                        </div>
                      ) : ''}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                </tr>
                {/* แถวเวร */}
                <tr>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">
                    {memberIndex + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                    เวร
                  </td>
                  {days.map((day, dayIndex) => {
                    const isHolidayDay = isHoliday(day);
                    const isWeekendDay = isWeekend(day);
                    const shiftValue = schedule.schedule[member.id]?.[dayIndex]?.shift || '';
                    
                    return (
                      <td 
                        key={dayIndex} 
                        className={`border border-gray-300 px-1 py-1 text-xs text-center ${
                          isHolidayDay ? 'bg-orange-100' : 
                          isWeekendDay ? 'bg-yellow-50' : ''
                        }`}
                      >
                        {day ? (
                          <div className="min-h-[2rem] flex items-center justify-center">
                            {shiftValue}
                          </div>
                        ) : ''}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">-</td>
                </tr>
              </React.Fragment>
            ))}
            
            {/* แถวสรุป */}
            <tr className="bg-blue-50">
              <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 text-center" colSpan="2">
                สรุป
              </td>
              {days.map((day, dayIndex) => (
                <td key={dayIndex} className="border border-gray-300 px-1 py-1 text-xs text-gray-600 text-center">
                  {day ? (
                    <div className="min-h-[2rem] flex flex-col items-center justify-center text-xs">
                      <div>ช:{shiftSummary[dayIndex]?.ช || 0}</div>
                      <div>บ:{shiftSummary[dayIndex]?.บ || 0}</div>
                      <div>ด:{shiftSummary[dayIndex]?.ด || 0}</div>
                    </div>
                  ) : ''}
                </td>
              ))}
              <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 text-center">-</td>
              <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 text-center">-</td>
              <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* หัวข้อและเมนู */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">ตารางเวรก่อนแลก</h1>
            <div className="flex items-center gap-4">
              {/* เลือกการดูตาราง */}
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="nurses">พยาบาลเท่านั้น</option>
                <option value="assistants">ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้เท่านั้น</option>
              </select>
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={() => setSelectedMonth(schedule.monthKey)}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* แสดงตารางเวรที่เลือก */}
            {selectedMonth && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ตารางเวร {getMonthName(selectedMonth)}
                  </h2>
                  <button
                    onClick={() => setSelectedMonth(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {renderScheduleTable(schedules.find(s => s.monthKey === selectedMonth))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousSchedule;
