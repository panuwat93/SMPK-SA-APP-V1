import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const PreviousSchedule = ({ userData }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // โหลดข้อมูลทีม
  useEffect(() => {
    const fetchTeam = async () => {
      if (!userData?.department) return;
      
      try {
        const teamRef = doc(db, 'teams', userData.department);
        const teamDoc = await getDoc(teamRef);
        
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          setTeamMembers(teamData.members || []);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    fetchTeam();
  }, [userData?.department]);

  // โหลดตารางเวรก่อนแลกทั้งหมด
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!userData?.department) return;
      
      try {
        setLoading(true);
        const schedulesRef = collection(db, 'schedulesBeforeExchange');
        const q = query(where('department', '==', userData.department));
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

    fetchSchedules();
  }, [userData?.department]);

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

  // แสดงตารางเวร
  const renderScheduleTable = (schedule) => {
    const days = getDaysInMonth(schedule.monthKey);
    
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
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member, memberIndex) => (
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
                </tr>
                {/* แถวเวร */}
                <tr>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 text-center">
                    {memberIndex + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                    เวร
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
                </tr>
              </React.Fragment>
            ))}
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* หัวข้อ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ตารางเวรก่อนแลก</h1>
          <p className="text-gray-600">แสดงตารางเวรที่บันทึกไว้ก่อนการแลกเวร</p>
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
