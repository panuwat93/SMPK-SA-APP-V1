import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShiftSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
    }
  }, [userData]);

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
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-800">ตารางเวร</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xl font-semibold text-slate-700">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-slate-600 font-medium text-center">แผนก: {userData?.department}</p>
          
          {/* ข้อมูล Debug */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">ข้อมูล Debug:</p>
            <p className="text-sm text-blue-700">{debugInfo}</p>
            <p className="text-sm text-blue-700">จำนวนสมาชิกทั้งหมด: {teamMembers.length} คน</p>
            <p className="text-sm text-blue-700">พยาบาล: {nurses.length} คน</p>
            <p className="text-sm text-blue-700">ผู้ช่วยพยาบาล: {nursingAssistants.length} คน</p>
            <p className="text-sm text-blue-700">พนักงานผู้ช่วยเหลือคนไข้: {patientHelpers.length} คน</p>
            <p className="text-sm text-blue-700">รวมตารางผู้ช่วย: {assistants.length} คน</p>
            {teamMembers.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-blue-700 font-medium">รายชื่อสมาชิกในทีม:</p>
                <div className="text-xs text-blue-600">
                  {teamMembers.map((member, index) => (
                    <div key={member.id}>
                      {index + 1}. {member.firstName} {member.lastName} ({member.role})
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            {nurses.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-xl font-semibold text-center">พยาบาล ({nurses.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-48">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-20">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-20">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurses.map((nurse, index) => (
                        <React.Fragment key={nurse.id}>
                          {/* แถวที่ 1: ชื่อ */}
                          <tr>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                              {nurse.firstName} {nurse.lastName}
                            </td>
                            {days.map((day, dayIndex) => (
                              <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center ${day.isWeekend ? 'bg-yellow-50' : ''}`}>
                                {/* เซลล์เวร - ไว้ใส่ข้อมูลเวร */}
                              </td>
                            ))}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                          </tr>
                          {/* แถวที่ 2: ตำแหน่ง */}
                          <tr>
                            {days.map((day, dayIndex) => (
                              <td key={dayIndex} className={`border border-gray-300 px-1 py-1 ${day.isWeekend ? 'bg-yellow-50' : ''}`}></td>
                            ))}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-blue-800 text-white">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป พยาบาล
                        </td>
                        {days.map((day, dayIndex) => (
                          <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div>ช:0</div>
                            <div>บ:0</div>
                            <div>ด:0</div>
                          </td>
                        ))}
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
                <div className="bg-green-600 text-white p-4">
                  <h2 className="text-xl font-semibold text-center">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้ ({assistants.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-48">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-20">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-20">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map((assistant, index) => (
                        <React.Fragment key={assistant.id}>
                          {/* แถวที่ 1: ชื่อ */}
                          <tr>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                              {assistant.firstName} {assistant.lastName}
                            </td>
                            {days.map((day, dayIndex) => (
                              <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center ${day.isWeekend ? 'bg-yellow-50' : ''}`}>
                                {/* เซลล์เวร - ไว้ใส่ข้อมูลเวร */}
                              </td>
                            ))}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50">0</td>
                          </tr>
                          {/* แถวที่ 2: ตำแหน่ง */}
                          <tr>
                            {days.map((day, dayIndex) => (
                              <td key={dayIndex} className={`border border-gray-300 px-1 py-1 ${day.isWeekend ? 'bg-yellow-50' : ''}`}></td>
                            ))}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-blue-800 text-white">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้
                        </td>
                        {days.map((day, dayIndex) => (
                          <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                            <div>ช:0</div>
                            <div>บ:0</div>
                            <div>ด:0</div>
                          </td>
                        ))}
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
