import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, updateDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import LandscapeToggle from '../components/LandscapeToggle';

const ExchangeShift = ({ userData }) => {
  const isSupervisor = userData?.userType === 'Admin';
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
  const [allExchangeRequests, setAllExchangeRequests] = useState([]); // สำหรับหัวหน้า
  const [supervisorView, setSupervisorView] = useState('pending'); // 'pending' หรือ 'completed'

  useEffect(() => {
    if (userData?.department) {
      if (isSupervisor) {
        // สำหรับหัวหน้า - ใช้ real-time listener
        const q = query(
          collection(db, 'exchangeRequests'),
          where('requesterDepartment', '==', userData.department)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const requests = [];
          querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setAllExchangeRequests(requests);
        });
        
        return () => unsubscribe();
      } else {
        // สำหรับเจ้าหน้าที่ - ดึงข้อมูลทีมและตัวเลือกเวร
        fetchTeamMembers();
        fetchShiftOptions();
        
        // ใช้ real-time listener สำหรับรายการขอแลกของตัวเอง
        const q = query(
          collection(db, 'exchangeRequests'),
          where('requesterId', '==', userData.uid)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const requests = [];
          querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setExchangeRequests(requests);
        });
        
        return () => unsubscribe();
      }
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

  const fetchShifts = (memberId, date) => {
    setLoading(true);
    try {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const dayIndex = dateObj.getDate() - 1;
      
      console.log('Setting up real-time listener for shifts:', { memberId, date, monthKey, dayIndex });
      
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      
      // ใช้ onSnapshot สำหรับ Real-time updates
      const unsubscribe = onSnapshot(scheduleRef, (scheduleDoc) => {
      
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
        
        setLoading(false);
        } else {
          console.log('Schedule document does not exist');
          setLoading(false);
        }
      }, (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      });
      
      // คืนค่า unsubscribe function สำหรับ cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
      setLoading(false);
      return null;
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

  const handleSaveExchange = async () => {
    if (!selectedMyShift || !selectedOtherShift) {
      alert('กรุณาเลือกเวรที่ต้องการแลก');
      return;
    }
    
    const exchangeRequest = {
      requesterId: userData.uid,
      requesterName: `${userData.firstName} ${userData.lastName}`,
      requesterDepartment: userData.department,
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
    
    // บันทึกลง Firebase
    try {
      await addDoc(collection(db, 'exchangeRequests'), exchangeRequest);
      alert('บันทึกการแลกเวรเรียบร้อย');
    } catch (error) {
      console.error('Error saving exchange request:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    
    // รีเซ็ตข้อมูล
    setSelectedMyShift(null);
    setSelectedOtherShift(null);
    setSelectedMember('');
    setSelectedDate('');
    setMyShifts({ top: '', bottom: '' });
    setOtherShifts({ top: '', bottom: '' });
  };

  const handleSaveGive = async () => {
    if (!selectedMyShift) {
      alert('กรุณาเลือกเวรที่ต้องการยก');
      return;
    }

    // ตรวจสอบว่าคนรับมีช่องว่างหรือไม่
    const targetTopShift = otherShifts.top;
    const targetBottomShift = otherShifts.bottom;
    
    // ตรวจสอบว่าช่องไหนว่าง (ไม่มีเวร หรือ O)
    const isTopEmpty = !targetTopShift || targetTopShift === '' || targetTopShift === 'O';
    const isBottomEmpty = !targetBottomShift || targetBottomShift === '' || targetBottomShift === 'O';
    
    if (!isTopEmpty && !isBottomEmpty) {
      alert('ไม่สามารถยกเวรได้ เนื่องจากเจ้าหน้าที่ที่เลือกไม่มีช่องว่าง (ต้องมีช่อง "ไม่มีเวร" หรือ "O")');
      return;
    }

    // หาตำแหน่งที่จะใส่เวร (ช่องว่าง)
    let targetShiftType = null;
    if (isTopEmpty) {
      targetShiftType = 'top';
    } else if (isBottomEmpty) {
      targetShiftType = 'bottom';
    }
    
    const giveRequest = {
      requesterId: userData.uid,
      requesterName: `${userData.firstName} ${userData.lastName}`,
      requesterDepartment: userData.department,
      targetId: selectedMember,
      targetName: `${teamMembers.find(m => m.id === selectedMember)?.firstName} ${teamMembers.find(m => m.id === selectedMember)?.lastName}`,
      date: selectedDate,
      myShiftType: selectedMyShift,
      myShiftValue: myShifts[selectedMyShift],
      targetShiftType: targetShiftType, // เพิ่มตำแหน่งที่จะใส่เวร
      status: 'pending',
      type: 'give', // ระบุว่าเป็นการยกเวร
      createdAt: new Date().toISOString()
    };
    
    console.log('บันทึกการยกเวร:', giveRequest);
    
    // บันทึกลง Firebase
    try {
      await addDoc(collection(db, 'exchangeRequests'), giveRequest);
      alert('บันทึกการยกเวรเรียบร้อย');
    } catch (error) {
      console.error('Error saving give request:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    
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
      // ดึงข้อมูลจาก Firebase เฉพาะของเจ้าหน้าที่คนนี้
      const q = query(
        collection(db, 'exchangeRequests'),
        where('requesterId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setExchangeRequests(requests);
    } catch (error) {
      console.error('Error fetching exchange requests:', error);
    }
  };

  const fetchAllExchangeRequests = async () => {
    try {
      // ดึงข้อมูลจาก Firebase ทั้งหมดในแผนก
      const q = query(
        collection(db, 'exchangeRequests'),
        where('requesterDepartment', '==', userData.department)
      );
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      
      setAllExchangeRequests(requests);
    } catch (error) {
      console.error('Error fetching all exchange requests:', error);
      // ลองดึงข้อมูลทั้งหมดก่อน
      try {
        const allQuery = query(collection(db, 'exchangeRequests'));
        const allSnapshot = await getDocs(allQuery);
        const allRequests = [];
        allSnapshot.forEach((doc) => {
          allRequests.push({ id: doc.id, ...doc.data() });
        });
        setAllExchangeRequests(allRequests);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setAllExchangeRequests([]);
      }
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      // หาข้อมูล request ที่จะอนุมัติ
      const request = allExchangeRequests.find(req => req.id === requestId);
      if (!request) {
        alert('ไม่พบข้อมูลการขอแลกเวร');
        return;
      }

      // 1. อัปเดตสถานะใน Firebase
      const requestRef = doc(db, 'exchangeRequests', requestId);
      await updateDoc(requestRef, { status: 'approved' });

      // 2. อัปเดตตารางเวรใน Firebase
      const dateObj = new Date(request.date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const dayIndex = dateObj.getDate() - 1;
      
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        const updatedSchedule = { ...scheduleData.schedule };
        
        // ตรวจสอบประเภทการขอ (แลกเวร หรือ ยกเวร)
        if (request.type === 'give') {
          // การยกเวร: ตัวเองกลายเป็น O, คนที่รับได้เวรไปที่ช่องว่าง
          if (request.myShiftType === 'top') {
            // ยกเวรบน - ตัวเองกลายเป็น O บน
            if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
              updatedSchedule[request.requesterId][dayIndex].top = 'O';
            }
            // คนรับได้เวรไปที่ช่องว่าง (targetShiftType)
            if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
              if (request.targetShiftType === 'top') {
                updatedSchedule[request.targetId][dayIndex].top = request.myShiftValue;
              } else if (request.targetShiftType === 'bottom') {
                updatedSchedule[request.targetId][dayIndex].bottom = request.myShiftValue;
              }
            }
          } else if (request.myShiftType === 'bottom') {
            // ยกเวรล่าง - ตัวเองกลายเป็น O ล่าง
            if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
              updatedSchedule[request.requesterId][dayIndex].bottom = 'O';
            }
            // คนรับได้เวรไปที่ช่องว่าง (targetShiftType)
            if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
              if (request.targetShiftType === 'top') {
                updatedSchedule[request.targetId][dayIndex].top = request.myShiftValue;
              } else if (request.targetShiftType === 'bottom') {
                updatedSchedule[request.targetId][dayIndex].bottom = request.myShiftValue;
              }
            }
          }
        } else {
          // การแลกเวร: สลับเวรกัน
          const requesterTopKey = `${request.requesterId}-${dayIndex}-top`;
          const requesterBottomKey = `${request.requesterId}-${dayIndex}-bottom`;
          const targetTopKey = `${request.targetId}-${dayIndex}-top`;
          const targetBottomKey = `${request.targetId}-${dayIndex}-bottom`;
          
          if (request.myShiftType === 'top' && request.otherShiftType === 'top') {
            // สลับเวรบนกับเวรบน
            const temp = updatedSchedule[request.requesterId]?.[dayIndex]?.top;
            if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
              updatedSchedule[request.requesterId][dayIndex].top = updatedSchedule[request.targetId]?.[dayIndex]?.top || '';
            }
            if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
              updatedSchedule[request.targetId][dayIndex].top = temp || '';
            }
          } else if (request.myShiftType === 'bottom' && request.otherShiftType === 'bottom') {
            // สลับเวรล่างกับเวรล่าง
            const temp = updatedSchedule[request.requesterId]?.[dayIndex]?.bottom;
            if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
              updatedSchedule[request.requesterId][dayIndex].bottom = updatedSchedule[request.targetId]?.[dayIndex]?.bottom || '';
            }
            if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
              updatedSchedule[request.targetId][dayIndex].bottom = temp || '';
            }
        } else if (request.myShiftType === 'top' && request.otherShiftType === 'bottom') {
          // สลับเวรบนกับเวรล่าง
          const temp = updatedSchedule[request.requesterId]?.[dayIndex]?.top;
          if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
            updatedSchedule[request.requesterId][dayIndex].top = updatedSchedule[request.targetId]?.[dayIndex]?.bottom || '';
          }
          if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
            updatedSchedule[request.targetId][dayIndex].bottom = temp || '';
          }
        } else if (request.myShiftType === 'bottom' && request.otherShiftType === 'top') {
          // สลับเวรล่างกับเวรบน
          const temp = updatedSchedule[request.requesterId]?.[dayIndex]?.bottom;
          if (updatedSchedule[request.requesterId] && updatedSchedule[request.requesterId][dayIndex]) {
            updatedSchedule[request.requesterId][dayIndex].bottom = updatedSchedule[request.targetId]?.[dayIndex]?.top || '';
          }
          if (updatedSchedule[request.targetId] && updatedSchedule[request.targetId][dayIndex]) {
            updatedSchedule[request.targetId][dayIndex].top = temp || '';
          }
        }
        }
        
        // บันทึกตารางเวรที่อัปเดตแล้ว
        await updateDoc(scheduleRef, {
          schedule: updatedSchedule,
          updatedAt: new Date(),
          updatedBy: userData.uid
        });
      }
      
      // 3. อัปเดตใน state
      setAllExchangeRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved' }
            : req
        )
      );
      
      alert('อนุมัติการแลกเวรเรียบร้อย - ตารางเวรได้รับการอัปเดตแล้ว');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      // อัปเดตใน Firebase
      const requestRef = doc(db, 'exchangeRequests', requestId);
      await updateDoc(requestRef, { status: 'rejected' });
      
      // อัปเดตใน state
      setAllExchangeRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'rejected' }
            : request
        )
      );
      
      alert('ปฏิเสธการแลกเวรเรียบร้อย');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };



  // ถ้าเป็นหัวหน้า ให้แสดงหน้ารายการขอแลกเวร
  if (isSupervisor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              รายการขอแลกเวร
            </h1>
            <p className="text-gray-600 mb-6">
              อนุมัติหรือปฏิเสธการขอแลกเวรจากเจ้าหน้าที่
            </p>
            
            {/* ปุ่มเลือกประเภทรายการ */}
            <div className="flex space-x-4">
              <button
                onClick={() => setSupervisorView('pending')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  supervisorView === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                รายการขอแลกเวร/ยกเวร
              </button>
              <button
                onClick={() => setSupervisorView('completed')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  supervisorView === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                รายการที่ดำเนินการแล้ว
              </button>
            </div>
          </div>

          {/* รายการขอแลกเวร */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {(() => {
              const filteredRequests = allExchangeRequests.filter(request => {
                if (supervisorView === 'pending') {
                  return request.status === 'pending';
                } else {
                  return request.status === 'approved' || request.status === 'rejected';
                }
              });
              
              return filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {supervisorView === 'pending' 
                    ? 'ยังไม่มีรายการขอแลกเวร' 
                    : 'ยังไม่มีรายการที่ดำเนินการแล้ว'}
                </h3>
                <p className="text-gray-600">
                  {supervisorView === 'pending' 
                    ? 'เมื่อเจ้าหน้าที่ส่งคำขอแลกเวร รายการจะแสดงที่นี่' 
                    : 'รายการที่อนุมัติหรือปฏิเสธแล้วจะแสดงที่นี่'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">วันที่แลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้ขอแลก/ยก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้รับแลก/ยก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">รายละเอียดเวร</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">สถานะหลังแลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">สถานะ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">วันที่ส่ง</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {new Date(request.date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {request.requesterName}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center ${
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
                        <td className="px-6 py-4 text-sm">
                          {request.status === 'pending' ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">
                              {request.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            })()}
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
              <h3 className="text-2xl font-bold text-gray-800 mb-4">รายการขอแลกเวร/ยกเวร</h3>
              <p className="text-gray-600 leading-relaxed">
                ดูรายการขอแลกเวร/ยกเวรที่ส่งไป
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
                รายการขอแลกเวร/ยกเวร
              </h1>
              <p className="text-gray-600">
                ดูรายการขอแลกเวร/ยกเวรที่ส่งไป
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">วันที่แลก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้ขอแลก/ยก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ผู้รับแลก/ยก</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">รายละเอียดเวร</th>
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
                          {request.requesterName}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center ${
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

  // หน้ายกเวร
  if (currentView === 'give') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                ยกเวร
              </h1>
              <p className="text-gray-600">
                ยกเวรให้เจ้าหน้าที่คนอื่น
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
              {/* เลือกเจ้าหน้าที่ที่จะรับเวร */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกเจ้าหน้าที่ที่จะรับเวร
                </label>
                <select
                  value={selectedMember}
                  onChange={handleMemberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">เลือกเจ้าหน้าที่ที่จะรับเวร</option>
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
                    <h4 className="font-semibold text-gray-800 mb-3">เวรของฉัน (ที่จะยก)</h4>
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
                          {myShifts.top || 'ไม่มี'}
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
                          {myShifts.bottom || 'ไม่มี'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>หมายเหตุ:</strong> เมื่อยกเวร เวรที่เลือกจะกลายเป็น "O" (ว่าง) และจะถูกส่งให้เจ้าหน้าที่ที่เลือก
                      </p>
                    </div>
                  </div>

                  {/* เวรของคนที่จะรับ */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">เวรของ {teamMembers.find(m => m.id === selectedMember)?.firstName} {teamMembers.find(m => m.id === selectedMember)?.lastName}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">เวรบน:</span>
                        <span 
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: getShiftColor(otherShifts.top, otherShiftStyles.top).backgroundColor,
                            color: getShiftColor(otherShifts.top, otherShiftStyles.top).color
                          }}
                        >
                          {otherShifts.top || 'ไม่มี'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">เวรล่าง:</span>
                        <span 
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: getShiftColor(otherShifts.bottom, otherShiftStyles.bottom).backgroundColor,
                            color: getShiftColor(otherShifts.bottom, otherShiftStyles.bottom).color
                          }}
                        >
                          {otherShifts.bottom || 'ไม่มี'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>หมายเหตุ:</strong> เจ้าหน้าที่คนนี้จะได้รับเวรที่คุณยกให้
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ปุ่มบันทึก */}
              {selectedMyShift && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSaveGive}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการยกเวร'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // หน้าแลกเวร
  return (
    <>
      <style>{`
        /* Auto Landscape Mode for Mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .exchange-container {
            padding: 8px !important;
          }
          
          .exchange-header h1 {
            font-size: 1.25rem !important;
            margin-bottom: 8px !important;
          }
          
          .exchange-header p {
            font-size: 0.875rem !important;
          }
          
          .exchange-card {
            padding: 12px !important;
            margin-bottom: 12px !important;
          }
          
          .exchange-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .exchange-shift-box {
            padding: 8px !important;
          }
          
          .exchange-shift-box h4 {
            font-size: 0.875rem !important;
            margin-bottom: 8px !important;
          }
          
          .exchange-button {
            padding: 8px 16px !important;
            font-size: 0.875rem !important;
          }
          
          .exchange-back-button {
            padding: 6px 12px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      
      <div className="exchange-container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="exchange-header flex items-center justify-between mb-8">
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
            className="exchange-back-button px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            กลับ
          </button>
        </div>

        {/* Form */}
        <div className="exchange-card bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="exchange-form-grid grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="exchange-form-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* เวรของตัวเอง */}
                 <div className="exchange-shift-box border border-gray-200 rounded-lg p-4">
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
                 <div className="exchange-shift-box border border-gray-200 rounded-lg p-4">
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
                  className="exchange-button px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  บันทึกการแลกเวร
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ปุ่มลอยสำหรับสลับโหมดแนวนอน */}
      <LandscapeToggle />
    </div>
    </>
  );
};

export default ExchangeShift;
