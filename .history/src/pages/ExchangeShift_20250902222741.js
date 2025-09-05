import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ExchangeShift = ({ userData }) => {
  const isSupervisor = userData?.role === 'หัวหน้าหน่วยงาน';
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'exchange', 'give', 'requests'
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [myShifts, setMyShifts] = useState({ top: '', bottom: '' });
  const [otherShifts, setOtherShifts] = useState({ top: '', bottom: '' });
  const [myShiftStyles, setMyShiftStyles] = useState({ top: {}, bottom: {} });
  const [otherShiftStyles, setOtherShiftStyles] = useState({ top: {}, bottom: {} });
  const [selectedMyShift, setSelectedMyShift] = useState(null); // 'top' หรือ 'bottom'
  const [selectedOtherShift, setSelectedOtherShift] = useState(null); // 'top' หรือ 'bottom'
  const [shiftOptions, setShiftOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exchangeRequests, setExchangeRequests] = useState([]);

  useEffect(() => {
    if (userData?.department && !isSupervisor) {
      fetchTeamMembers();
      fetchShiftOptions();
    }
  }, [userData, isSupervisor]);

  const fetchTeamMembers = async () => {
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const members = teamDoc.data().members || [];
        console.log('All team members:', members);
        console.log('Current user role:', userData.role);
        console.log('Current user UID:', userData.uid);
        
        // กรองคนที่สามารถแลกเวรได้
        const exchangeableMembers = members.filter(member => {
          console.log(`Checking member: ${member.firstName} ${member.lastName}, role: ${member.role}, id: ${member.id}`);
          
          // ไม่รวมตัวเอง
          if (member.id === userData.uid) {
            console.log('Skipping self');
            return false;
          }
          
          // พยาบาลแลกได้เฉพาะพยาบาล
          if (userData.role === 'พยาบาล') {
            const canExchange = member.role === 'พยาบาล';
            console.log(`Nurse can exchange with ${member.role}: ${canExchange}`);
            return canExchange;
          }
          
          // ผู้ช่วยพยาบาลและผู้ช่วยเหลือคนไข้แลกกันได้
          if (userData.role === 'ผู้ช่วยพยาบาล' || userData.role === 'ผู้ช่วยเหลือคนไข้' || userData.role === 'พนักงานผู้ช่วยเหลือคนไข้') {
            const canExchange = member.role === 'ผู้ช่วยพยาบาล' || member.role === 'ผู้ช่วยเหลือคนไข้' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้';
            console.log(`Assistant can exchange with ${member.role}: ${canExchange}`);
            return canExchange;
          }
          
          console.log('No matching role condition');
          return false;
        });
        
        console.log('Exchangeable members:', exchangeableMembers);
        setTeamMembers(exchangeableMembers);
      } else {
        console.log('Team document does not exist');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
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

  const handleExchangeClick = () => {
    setCurrentView('exchange');
  };

  const handleGiveClick = () => {
    setCurrentView('give');
  };

  const handleRequestsClick = () => {
    setCurrentView('requests');
    fetchExchangeRequests();
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setSelectedMember('');
    setSelectedDate('');
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
    setMyShiftStyles({ top: {}, bottom: {} });
    setOtherShiftStyles({ top: {}, bottom: {} });
    setSelectedMyShift(null);
    setSelectedOtherShift(null);
  };

  const handleMemberChange = (e) => {
    setSelectedMember(e.target.value);
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
    setMyShiftStyles({ top: {}, bottom: {} });
    setOtherShiftStyles({ top: {}, bottom: {} });
    setSelectedMyShift(null);
    setSelectedOtherShift(null);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedMyShift(null);
    setSelectedOtherShift(null);
    if (selectedMember && e.target.value) {
      fetchShifts(selectedMember, e.target.value);
    }
  };

  const fetchShifts = async (memberId, date) => {
    setLoading(true);
    try {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const dayIndex = dateObj.getDate() - 1;
      
      console.log('Fetching shifts for:', { memberId, date, monthKey, dayIndex });
      
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        const schedule = scheduleData.schedule || {};
        const cellStyles = scheduleData.cellStyles || {};
        
        console.log('Schedule data exists, keys:', Object.keys(schedule));
        
        // ใช้วิธีเดียวกับ ShiftSchedule - ดึงข้อมูลจาก scheduleData.schedule[memberId][dayIndex][rowType]
        const myTopShift = schedule[userData.uid]?.[dayIndex]?.['top'] || '';
        const myBottomShift = schedule[userData.uid]?.[dayIndex]?.['bottom'] || '';
        const otherTopShift = schedule[memberId]?.[dayIndex]?.['top'] || '';
        const otherBottomShift = schedule[memberId]?.[dayIndex]?.['bottom'] || '';
        
        console.log('Found shifts:', {
          myTop: myTopShift,
          myBottom: myBottomShift,
          otherTop: otherTopShift,
          otherBottom: otherBottomShift
        });
        
        setMyShifts({ top: myTopShift, bottom: myBottomShift });
        setOtherShifts({ top: otherTopShift, bottom: otherBottomShift });
        
        // ดึงสไตล์
        setMyShiftStyles({ 
          top: cellStyles[`${userData.uid}-${dayIndex}-top`] || {}, 
          bottom: cellStyles[`${userData.uid}-${dayIndex}-bottom`] || {} 
        });
        
        setOtherShiftStyles({ 
          top: cellStyles[`${memberId}-${dayIndex}-top`] || {}, 
          bottom: cellStyles[`${memberId}-${dayIndex}-bottom`] || {} 
        });
        
        // รีเซ็ตการเลือก
        setSelectedMyShift(null);
        setSelectedOtherShift(null);
      } else {
        console.log('Schedule document does not exist');
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftColor = (shift, cellStyle) => {
    if (!shift || shift.trim() === '') return { className: 'text-gray-500', backgroundColor: 'transparent', color: '#6B7280' };
    
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

  const getShiftName = (shift) => {
    if (!shift || shift.trim() === '') return 'ไม่มี';
    
    const shiftOption = shiftOptions.find(option => option.name === shift);
    if (shiftOption) {
      return shiftOption.displayName || shift;
    }
    
    // แปลงชื่อเวรพื้นฐาน
    const shiftNames = {
      'ช': 'เช้า',
      'บ': 'บ่าย', 
      'ด': 'ดึก',
      'MB': 'MB',
      'VA': 'VA',
      'O': 'O',
      'ประชุม': 'ประชุม',
      'ช*': 'ช*'
    };
    
    return shiftNames[shift] || shift;
  };

  const handleMyShiftSelect = (shiftType) => {
    setSelectedMyShift(shiftType);
  };

  const handleOtherShiftSelect = (shiftType) => {
    setSelectedOtherShift(shiftType);
  };

  const handleSaveExchange = () => {
    if (!selectedMyShift || !selectedOtherShift) {
      alert('กรุณาเลือกเวรที่ต้องการแลก');
      return;
    }
    
    const exchangeRequest = {
      id: Date.now().toString(),
      requesterId: userData.uid,
      requesterName: `${userData.firstName} ${userData.lastName}`,
      targetId: selectedMember,
      targetName: `${teamMembers.find(m => m.id === selectedMember)?.firstName} ${teamMembers.find(m => m.id === selectedMember)?.lastName}`,
      date: selectedDate,
      myShiftType: selectedMyShift,
      myShiftValue: myShifts[selectedMyShift],
      otherShiftType: selectedOtherShift,
      otherShiftValue: otherShifts[selectedOtherShift],
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    console.log('บันทึกการแลกเวร:', exchangeRequest);
    
    // บันทึกลง state ทันที
    setExchangeRequests(prev => [exchangeRequest, ...prev]);
    
    // TODO: บันทึกลง Firebase
    alert('บันทึกการแลกเวรเรียบร้อย');
    
    // รีเซ็ตข้อมูล
    setSelectedMyShift(null);
    setSelectedOtherShift(null);
    setSelectedMember('');
    setSelectedDate('');
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
  };

  const fetchExchangeRequests = async () => {
    try {
      // TODO: ดึงข้อมูลจาก Firebase
      // ตอนนี้ใช้ข้อมูลที่มีอยู่ใน state แล้ว
      console.log('Current exchange requests:', exchangeRequests);
    } catch (error) {
      console.error('Error fetching exchange requests:', error);
    }
  };



  // ถ้าเป็นหัวหน้า ให้แสดงข้อความว่าไม่สามารถเข้าถึงได้
  if (isSupervisor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">ไม่สามารถเข้าถึงได้</h2>
            <p className="text-red-600">หน้านี้สำหรับเจ้าหน้าที่เท่านั้น</p>
          </div>
        </div>
      </div>
    );
  }

  // หน้าเมนูหลัก
  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              แลกเวร
            </h1>
            <p className="text-gray-600">
              เลือกประเภทการดำเนินการที่ต้องการ
            </p>
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* แลกเวร */}
            <div 
              onClick={handleExchangeClick}
              className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">แลกเวร</h3>
              <p className="text-gray-600 leading-relaxed">
                ขอแลกเวรกับเจ้าหน้าที่คนอื่น
              </p>
            </div>

            {/* ยกเวร */}
            <div 
              onClick={handleGiveClick}
              className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ยกเวร</h3>
              <p className="text-gray-600 leading-relaxed">
                ขอยกเวรให้เจ้าหน้าที่คนอื่น
              </p>
            </div>

            {/* รายการขอแลกเวร */}
            <div 
              onClick={handleRequestsClick}
              className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">รายการขอแลกเวร</h3>
              <p className="text-gray-600 leading-relaxed">
                ดูรายการขอแลกเวรที่ส่งไป
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // หน้ารายการขอแลกเวร
  if (currentView === 'requests') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                รายการขอแลกเวร
              </h1>
              <p className="text-gray-600">
                ดูรายการขอแลกเวรที่ส่งไป
              </p>
            </div>
            <button
              onClick={handleBackToMenu}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              กลับ
            </button>
          </div>

          {/* รายการขอแลกเวร */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {exchangeRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ยังไม่มีรายการขอแลกเวร</h3>
                <p className="text-gray-600">เมื่อมีการขอแลกเวร รายการจะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">วันที่</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้ขอแลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้รับแลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">เวรก่อนแลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">เวรหลังแลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">สถานะ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">วันที่ส่ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exchangeRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {new Date(request.date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {request.targetName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 text-xs">{request.requesterName}:</span>
                              <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: getShiftColor(request.myShiftValue, {}).backgroundColor,
                                  color: getShiftColor(request.myShiftValue, {}).color
                                }}
                              >
                                {getShiftName(request.myShiftValue)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 text-xs">{request.targetName}:</span>
                              <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: getShiftColor(request.otherShiftValue, {}).backgroundColor,
                                  color: getShiftColor(request.otherShiftValue, {}).color
                                }}
                              >
                                {getShiftName(request.otherShiftValue)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 text-xs">{request.requesterName}:</span>
                              <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: getShiftColor(request.otherShiftValue, {}).backgroundColor,
                                  color: getShiftColor(request.otherShiftValue, {}).color
                                }}
                              >
                                {getShiftName(request.otherShiftValue)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 text-xs">{request.targetName}:</span>
                              <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: getShiftColor(request.myShiftValue, {}).backgroundColor,
                                  color: getShiftColor(request.myShiftValue, {}).color
                                }}
                              >
                                {getShiftName(request.myShiftValue)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' ? 'รอการอนุมัติ' : 
                             request.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // หน้าแลกเวร
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {currentView === 'exchange' ? 'แลกเวร' : 'ยกเวร'}
            </h1>
            <p className="text-gray-600">
              {currentView === 'exchange' ? 'แลกเวรกับเจ้าหน้าที่คนอื่น' : 'ยกเวรให้เจ้าหน้าที่คนอื่น'}
            </p>
          </div>
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            กลับ
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* เลือกเจ้าหน้าที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกเจ้าหน้าที่
              </label>
              <select
                value={selectedMember}
                onChange={handleMemberChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">เลือกเจ้าหน้าที่</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* เลือกวันที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกวันที่
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* แสดงเวร */}
        {selectedMember && selectedDate && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">เวรในวันที่ {selectedDate}</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* เวรของตัวเอง */}
                 <div className="border border-gray-200 rounded-lg p-4">
                   <h4 className="font-semibold text-gray-800 mb-3">เวรของฉัน</h4>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">เวรบน:</span>
                       <button
                         onClick={() => handleMyShiftSelect('top')}
                         className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                           selectedMyShift === 'top' 
                             ? 'ring-2 ring-blue-500 ring-offset-2' 
                             : 'hover:opacity-80'
                         }`}
                         style={{
                           backgroundColor: getShiftColor(myShifts.top, myShiftStyles.top).backgroundColor,
                           color: getShiftColor(myShifts.top, myShiftStyles.top).color
                         }}
                       >
                         {getShiftName(myShifts.top)}
                       </button>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">เวรล่าง:</span>
                       <button
                         onClick={() => handleMyShiftSelect('bottom')}
                         className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                           selectedMyShift === 'bottom' 
                             ? 'ring-2 ring-blue-500 ring-offset-2' 
                             : 'hover:opacity-80'
                         }`}
                         style={{
                           backgroundColor: getShiftColor(myShifts.bottom, myShiftStyles.bottom).backgroundColor,
                           color: getShiftColor(myShifts.bottom, myShiftStyles.bottom).color
                         }}
                       >
                         {getShiftName(myShifts.bottom)}
                       </button>
                     </div>
                   </div>
                 </div>

                                 {/* เวรของคนที่จะแลก */}
                 <div className="border border-gray-200 rounded-lg p-4">
                   <h4 className="font-semibold text-gray-800 mb-3">
                     เวรของ {teamMembers.find(m => m.id === selectedMember)?.firstName} {teamMembers.find(m => m.id === selectedMember)?.lastName}
                   </h4>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">เวรบน:</span>
                       <button
                         onClick={() => handleOtherShiftSelect('top')}
                         className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                           selectedOtherShift === 'top' 
                             ? 'ring-2 ring-green-500 ring-offset-2' 
                             : 'hover:opacity-80'
                         }`}
                         style={{
                           backgroundColor: getShiftColor(otherShifts.top, otherShiftStyles.top).backgroundColor,
                           color: getShiftColor(otherShifts.top, otherShiftStyles.top).color
                         }}
                       >
                         {getShiftName(otherShifts.top)}
                       </button>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">เวรล่าง:</span>
                       <button
                         onClick={() => handleOtherShiftSelect('bottom')}
                         className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                           selectedOtherShift === 'bottom' 
                             ? 'ring-2 ring-green-500 ring-offset-2' 
                             : 'hover:opacity-80'
                         }`}
                         style={{
                           backgroundColor: getShiftColor(otherShifts.bottom, otherShiftStyles.bottom).backgroundColor,
                           color: getShiftColor(otherShifts.bottom, otherShiftStyles.bottom).color
                         }}
                       >
                         {getShiftName(otherShifts.bottom)}
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {/* ปุ่มบันทึกการแลกเวร */}
            {!loading && (myShifts.top || myShifts.bottom) && (otherShifts.top || otherShifts.bottom) && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleSaveExchange}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  บันทึกการแลกเวร
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeShift;
