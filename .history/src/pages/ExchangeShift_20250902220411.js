import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ExchangeShift = ({ userData }) => {
  const isSupervisor = userData?.role === 'หัวหน้าหน่วยงาน';
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'exchange', 'give'
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [myShifts, setMyShifts] = useState({ top: '', bottom: '' });
  const [otherShifts, setOtherShifts] = useState({ top: '', bottom: '' });
  const [myShiftStyles, setMyShiftStyles] = useState({ top: {}, bottom: {} });
  const [otherShiftStyles, setOtherShiftStyles] = useState({ top: {}, bottom: {} });
  const [shiftOptions, setShiftOptions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleExchangeClick = () => {
    setCurrentView('exchange');
  };

  const handleGiveClick = () => {
    setCurrentView('give');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setSelectedMember('');
    setSelectedDate('');
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
  };

  const handleMemberChange = (e) => {
    setSelectedMember(e.target.value);
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
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
      
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        const schedule = scheduleData.schedule || {};
        
        // ดึงเวรของตัวเอง
        const myTopShift = schedule[`${userData.uid}-${dayIndex}-top`] || '';
        const myBottomShift = schedule[`${userData.uid}-${dayIndex}-bottom`] || '';
        setMyShifts({ top: myTopShift, bottom: myBottomShift });
        
        // ดึงเวรของคนที่จะแลก
        const otherTopShift = schedule[`${memberId}-${dayIndex}-top`] || '';
        const otherBottomShift = schedule[`${memberId}-${dayIndex}-bottom`] || '';
        setOtherShifts({ top: otherTopShift, bottom: otherBottomShift });
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeShift = () => {
    // TODO: Implement actual shift exchange logic
    alert('ฟังก์ชันแลกเวรจะถูกพัฒนาต่อไป');
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">เวรบน:</span>
                      <span className="font-medium">{myShifts.top || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เวรล่าง:</span>
                      <span className="font-medium">{myShifts.bottom || 'ไม่มี'}</span>
                    </div>
                  </div>
                </div>

                {/* เวรของคนที่จะแลก */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    เวรของ {teamMembers.find(m => m.id === selectedMember)?.firstName} {teamMembers.find(m => m.id === selectedMember)?.lastName}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">เวรบน:</span>
                      <span className="font-medium">{otherShifts.top || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เวรล่าง:</span>
                      <span className="font-medium">{otherShifts.bottom || 'ไม่มี'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ปุ่มแลกเวร */}
            {!loading && (myShifts.top || myShifts.bottom) && (otherShifts.top || otherShifts.bottom) && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleExchangeShift}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {currentView === 'exchange' ? 'แลกเวร' : 'ยกเวร'}
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
