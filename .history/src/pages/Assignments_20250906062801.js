import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const Assignments = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [bedOptions, setBedOptions] = useState([]);
  const [dutyOptions, setDutyOptions] = useState([]);
  const [extraDutyOptions, setExtraDutyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState('morning'); // 'morning', 'afternoon', 'night'
  const [assignments, setAssignments] = useState({
    morning: { nurses: [], assistants: [] },
    afternoon: { nurses: [], assistants: [] },
    night: { nurses: [], assistants: [] }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [permissions, setPermissions] = useState({});
  const [canManageAssignments, setCanManageAssignments] = useState(false);
  
  // Real-time subscription cleanup
  const [scheduleUnsubscribe, setScheduleUnsubscribe] = useState(null);
  const [assignmentsUnsubscribe, setAssignmentsUnsubscribe] = useState(null);

  useEffect(() => {
    if (userData?.department) {
      fetchData();
    }
    
    // Cleanup function
    return () => {
      if (scheduleUnsubscribe) {
        scheduleUnsubscribe();
      }
      if (assignmentsUnsubscribe) {
        assignmentsUnsubscribe();
      }
    };
  }, [userData]);

  // จัดการเมื่อเปลี่ยนวันที่
  useEffect(() => {
    if (userData?.department && teamMembers.length > 0) {
      // ยกเลิก subscriptions เก่า
      if (scheduleUnsubscribe) {
        scheduleUnsubscribe();
      }
      if (assignmentsUnsubscribe) {
        assignmentsUnsubscribe();
      }
      
      // สร้าง subscriptions ใหม่สำหรับวันที่ใหม่
      const scheduleUnsub = loadScheduleData(selectedDate);
      const assignmentsUnsub = loadAssignments(selectedDate);
      
      setScheduleUnsubscribe(() => scheduleUnsub);
      setAssignmentsUnsubscribe(() => assignmentsUnsub);
    }
    
    // Cleanup function
    return () => {
      if (scheduleUnsubscribe) {
        scheduleUnsubscribe();
      }
      if (assignmentsUnsubscribe) {
        assignmentsUnsubscribe();
      }
    };
  }, [selectedDate, userData?.department, teamMembers.length]);

  const fetchData = async () => {
    try {
      // ยกเลิก subscriptions เก่า
      if (scheduleUnsubscribe) {
        scheduleUnsubscribe();
      }
      if (assignmentsUnsubscribe) {
        assignmentsUnsubscribe();
      }
      
      await Promise.all([
        fetchTeamMembers(),
        fetchBedOptions(),
        fetchDutyOptions(),
        fetchExtraDutyOptions(),
        fetchPermissions()
      ]);
      
      // สร้าง Real-time subscriptions ใหม่
      const scheduleUnsub = loadScheduleData();
      const assignmentsUnsub = loadAssignments();
      
      setScheduleUnsubscribe(() => scheduleUnsub);
      setAssignmentsUnsubscribe(() => assignmentsUnsub);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const members = teamDoc.data().members || [];
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchBedOptions = async () => {
    try {
      const bedOptionsRef = doc(db, 'bedOptions', userData.department);
      const bedOptionsDoc = await getDoc(bedOptionsRef);
      
      if (bedOptionsDoc.exists()) {
        const data = bedOptionsDoc.data();
        const options = data.options || [];
        
        // แปลงข้อมูลให้เป็นรูปแบบที่ต้องการ (object with id and name)
        const formattedOptions = options.map((option, index) => {
          if (typeof option === 'string') {
            return { id: index + 1, name: option };
          }
          return option; // ถ้าเป็น object อยู่แล้ว
        });
        
        setBedOptions(formattedOptions);
      } else {
        // ข้อมูลตัวอย่างสำหรับทดสอบ
        const sampleBeds = [
          { id: 1, name: 'เตียง 1' },
          { id: 2, name: 'เตียง 2' },
          { id: 3, name: 'เตียง 3' },
          { id: 4, name: 'เตียง 4' },
          { id: 5, name: 'เตียง 5' }
        ];
        setBedOptions(sampleBeds);
      }
    } catch (error) {
      console.error('Error fetching bed options:', error);
      setBedOptions([]);
    }
  };

  const fetchDutyOptions = async () => {
    try {
      const dutyOptionsRef = doc(db, 'dutyOptions', userData.department);
      const dutyOptionsDoc = await getDoc(dutyOptionsRef);
      
      if (dutyOptionsDoc.exists()) {
        const data = dutyOptionsDoc.data();
        const options = data.options || [];
        
        // แปลงข้อมูลให้เป็นรูปแบบที่ต้องการ (object with id and name)
        const formattedOptions = options.map((option, index) => {
          if (typeof option === 'string') {
            return { id: index + 1, name: option };
          }
          return option; // ถ้าเป็น object อยู่แล้ว
        });
        
        setDutyOptions(formattedOptions);
      } else {
        // ข้อมูลตัวอย่างสำหรับทดสอบ
        const sampleDuties = [
          { id: 1, name: 'พยาบาลประจำเตียง' },
          { id: 2, name: 'พยาบาลเวร' },
          { id: 3, name: 'พยาบาลห้องยา' },
          { id: 4, name: 'พยาบาล ER' },
          { id: 5, name: 'พยาบาล ICU' }
        ];
        setDutyOptions(sampleDuties);
      }
    } catch (error) {
      console.error('Error fetching duty options:', error);
      setDutyOptions([]);
    }
  };

  const fetchExtraDutyOptions = async () => {
    try {
      const extraDutyOptionsRef = doc(db, 'extraDutyOptions', userData.department);
      const extraDutyOptionsDoc = await getDoc(extraDutyOptionsRef);
      
      if (extraDutyOptionsDoc.exists()) {
        const data = extraDutyOptionsDoc.data();
        const options = data.options || [];
        
        // แปลงข้อมูลให้เป็นรูปแบบที่ต้องการ (object with id and name)
        const formattedOptions = options.map((option, index) => {
          if (typeof option === 'string') {
            return { id: index + 1, name: option };
          }
          return option; // ถ้าเป็น object อยู่แล้ว
        });
        
        setExtraDutyOptions(formattedOptions);
      } else {
        // ข้อมูลตัวอย่างสำหรับทดสอบ
        const sampleExtraDuties = [
          { id: 1, name: 'ERT 1' },
          { id: 2, name: 'ERT 2' },
          { id: 3, name: 'ERT 3' },
          { id: 4, name: 'ERT 4' },
          { id: 5, name: 'ERT 5' }
        ];
        setExtraDutyOptions(sampleExtraDuties);
      }
    } catch (error) {
      console.error('Error fetching extra duty options:', error);
      setExtraDutyOptions([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const permissionsRef = doc(db, 'permissions', userData.department);
      const permissionsDoc = await getDoc(permissionsRef);
      
      if (permissionsDoc.exists()) {
        const permissionsData = permissionsDoc.data().permissions || {};
        setPermissions(permissionsData);
        checkManagePermission(permissionsData);
      } else {
        // ถ้าไม่มีข้อมูลสิทธิ์ ให้ Admin มีสิทธิ์เสมอ
        if (userData?.userType === 'Admin') {
          setCanManageAssignments(true);
        } else {
          setCanManageAssignments(false);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // ถ้าเกิดข้อผิดพลาด ให้ Admin มีสิทธิ์เสมอ
      if (userData?.userType === 'Admin') {
        setCanManageAssignments(true);
      } else {
        setCanManageAssignments(false);
      }
    }
  };

  const checkManagePermission = (permissionsData) => {
    // Admin มีสิทธิ์เสมอ
    if (userData?.userType === 'Admin') {
      setCanManageAssignments(true);
      return;
    }
    
    // ตรวจสอบสิทธิ์จากข้อมูลที่เก็บไว้
    const userPermissions = permissionsData[userData?.uid];
    if (userPermissions && userPermissions.manageAssignments) {
      setCanManageAssignments(true);
    } else {
      setCanManageAssignments(false);
    }
  };

  const loadScheduleData = (date = selectedDate) => {
    try {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      
      // ใช้ onSnapshot สำหรับ Real-time updates
      const unsubscribe = onSnapshot(scheduleRef, (scheduleDoc) => {
        if (scheduleDoc.exists()) {
          const data = scheduleDoc.data();
          setScheduleData(data);
        } else {
          setScheduleData({});
        }
      }, (error) => {
        console.error('Error loading schedule data:', error);
        setScheduleData({});
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up schedule listener:', error);
      setScheduleData({});
      return null;
    }
  };

  const loadAssignments = (date = selectedDate) => {
    try {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const assignmentsRef = doc(db, 'assignments', `${userData.department}-${dateKey}`);
      
      // ใช้ onSnapshot สำหรับ Real-time updates
      const unsubscribe = onSnapshot(assignmentsRef, async (assignmentsDoc) => {
        if (assignmentsDoc.exists()) {
          const data = assignmentsDoc.data();
          setAssignments(data.assignments || {
            morning: { nurses: [], assistants: [] },
            afternoon: { nurses: [], assistants: [] },
            night: { nurses: [], assistants: [] }
          });
        } else {
          // สร้างข้อมูลจากตารางเวร
          await generateAssignmentsFromSchedule(date);
        }
      }, (error) => {
        console.error('Error loading assignments:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up assignments listener:', error);
      return null;
    }
  };

  const saveAssignmentsToFirebase = async (assignmentsData = assignments) => {
    // ตรวจสอบสิทธิ์การแก้ไข
    if (!canManageAssignments) {
      alert('คุณไม่มีสิทธิ์แก้ไขตารางมอบหมายงาน กรุณาติดต่อหัวหน้าหน่วยงาน');
      return;
    }
    
    try {
      const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const assignmentsRef = doc(db, 'assignments', `${userData.department}-${dateKey}`);
      
      await setDoc(assignmentsRef, {
        department: userData.department,
        date: dateKey,
        assignments: assignmentsData,
        savedAt: new Date(),
        savedBy: userData.username
      });
    } catch (error) {
      console.error('Error auto-saving assignments:', error);
    }
  };

  const saveAssignments = async () => {
    // ตรวจสอบสิทธิ์การแก้ไข
    if (!canManageAssignments) {
      alert('คุณไม่มีสิทธิ์แก้ไขตารางมอบหมายงาน กรุณาติดต่อหัวหน้าหน่วยงาน');
      return;
    }
    
    setSaving(true);
    try {
      await saveAssignmentsToFirebase();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setSaving(false);
    }
  };



    const updateNurseAssignment = (shift, assignmentId, field, value) => {
    // ตรวจสอบสิทธิ์การแก้ไข
    if (!canManageAssignments) {
      alert('คุณไม่มีสิทธิ์แก้ไขตารางมอบหมายงาน กรุณาติดต่อหัวหน้าหน่วยงาน');
      return;
    }
    
    setAssignments(prev => {
      const newAssignments = {
        ...prev,
        [shift]: {
          ...prev[shift],
          nurses: prev[shift].nurses.map(assignment =>
            assignment.id === assignmentId
              ? { ...assignment, [field]: value }
              : assignment
          )
        }
      };
      
      // บันทึกทันทีเมื่อมีการเปลี่ยนแปลง
      saveAssignmentsToFirebase(newAssignments);
      
      return newAssignments;
    });
  };

    const updateAssistantAssignment = (shift, assignmentId, field, value) => {
    // ตรวจสอบสิทธิ์การแก้ไข
    if (!canManageAssignments) {
      alert('คุณไม่มีสิทธิ์แก้ไขตารางมอบหมายงาน กรุณาติดต่อหัวหน้าหน่วยงาน');
      return;
    }
    
    setAssignments(prev => {
      const newAssignments = {
        ...prev,
        [shift]: {
          ...prev[shift],
          assistants: prev[shift].assistants.map(assignment => {
            if (assignment.id === assignmentId) {
              const updatedAssignment = { ...assignment, [field]: value };
              
              // ถ้าเปลี่ยนทีม ให้ตั้งค่า ERT อัตโนมัติ
              if (field === 'team') {
                if (value === 'TEAM A') {
                  updatedAssignment.ert = 'เคลื่อนย้ายกู้ชีพ';
                } else if (value === 'TEAM B') {
                  updatedAssignment.ert = 'ช่างและเส้นทาง';
                }
              }
              
              return updatedAssignment;
            }
            return assignment;
          })
        }
      };
      
      // บันทึกทันทีเมื่อมีการเปลี่ยนแปลง
      saveAssignmentsToFirebase(newAssignments);
      
      return newAssignments;
    });
  };



  const getNurses = () => {
    return teamMembers.filter(member => member.role === 'พยาบาล');
  };

  const getAssistants = () => {
    return teamMembers.filter(member => 
      member.role === 'ผู้ช่วยพยาบาล' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้'
    );
  };

  const getShiftName = (shift) => {
    const shiftNames = {
      morning: 'เช้า',
      afternoon: 'บ่าย',
      night: 'ดึก'
    };
    return shiftNames[shift] || shift;
  };

  const generateAssignmentsFromSchedule = async (date) => {
    const dayIndex = date.getDate() - 1; // วันที่ 1 = index 0
    const newAssignments = {
      morning: { nurses: [], assistants: [] },
      afternoon: { nurses: [], assistants: [] },
      night: { nurses: [], assistants: [] }
    };

    // ดึงเจ้าหน้าที่ที่มีเวรในวันที่เลือก
    teamMembers.forEach(member => {
      // ตรวจสอบข้อมูลจาก scheduleData.schedule
      const memberSchedule = scheduleData.schedule?.[member.id]?.[dayIndex];
      const topShift = memberSchedule?.top || '';
      const bottomShift = memberSchedule?.bottom || '';
      
      // ตรวจสอบเวรเช้า (ช)
      if (topShift === 'ช' || bottomShift === 'ช') {
        const assignment = {
          id: `${member.id}-morning`,
          memberId: member.id,
          bed: '',
          duty: '',
          ert: '',
          team: ''
        };
        
        if (member.role === 'พยาบาล') {
          newAssignments.morning.nurses.push(assignment);
        } else {
          newAssignments.morning.assistants.push(assignment);
        }
      }
      
      // ตรวจสอบเวรบ่าย (บ)
      if (topShift === 'บ' || bottomShift === 'บ') {
        const assignment = {
          id: `${member.id}-afternoon`,
          memberId: member.id,
          bed: '',
          duty: '',
          ert: '',
          team: ''
        };
        
        if (member.role === 'พยาบาล') {
          newAssignments.afternoon.nurses.push(assignment);
        } else {
          newAssignments.afternoon.assistants.push(assignment);
        }
      }
      
      // ตรวจสอบเวรดึก (ด)
      if (topShift === 'ด' || bottomShift === 'ด') {
        const assignment = {
          id: `${member.id}-night`,
          memberId: member.id,
          bed: '',
          duty: '',
          ert: '',
          team: ''
        };
        
        if (member.role === 'พยาบาล') {
          newAssignments.night.nurses.push(assignment);
        } else {
          newAssignments.night.assistants.push(assignment);
        }
      }
    });
    setAssignments(newAssignments);
  };

  const changeDate = async (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setSelectedDate(newDate);
    await loadScheduleData(newDate);
    await loadAssignments(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <style>{`
        select option {
          color: #000000 !important;
          background-color: #ffffff !important;
          padding: 8px 12px;
        }
        select option:hover {
          background-color: #f3f4f6 !important;
        }
        select option:checked {
          background-color: #3b82f6 !important;
          color: #ffffff !important;
        }
        
        /* Auto Landscape Mode for Mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .assignments-container {
            padding: 8px !important;
          }
          
          .assignments-header {
            padding: 12px !important;
            margin-bottom: 16px !important;
          }
          
          .assignments-header h1 {
            font-size: 1.25rem !important;
            margin-bottom: 8px !important;
          }
          
          .assignments-table {
            font-size: 0.75rem !important;
          }
          
          .assignments-table th,
          .assignments-table td {
            padding: 6px 8px !important;
          }
          
          .assignments-table select {
            padding: 4px 6px !important;
            font-size: 0.75rem !important;
          }
          
          .shift-tabs {
            gap: 4px !important;
          }
          
          .shift-tab {
            padding: 4px 8px !important;
            font-size: 0.75rem !important;
          }
          
          .table-section {
            margin-bottom: 16px !important;
          }
          
          .section-header {
            padding: 8px 12px !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>


      {/* Header */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 sm:order-1"></div>
          <div className="text-center flex-1 sm:order-2">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800">ตารางมอบหมายงาน</h1>
            {!canManageAssignments && (
              <div className="mt-2 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-xs sm:text-sm">
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="hidden sm:inline">โหมดดูอย่างเดียว - ไม่มีสิทธิ์แก้ไข</span>
                  <span className="sm:hidden">ดูอย่างเดียว</span>
                </span>
              </div>
            )}
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center sm:justify-end sm:order-3">
            <button
              onClick={() => changeDate('prev')}
              className="p-1.5 sm:p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-sm sm:text-lg font-semibold text-gray-800">
                {formatDate(selectedDate)}
              </div>
            </div>
            
            <button
              onClick={() => changeDate('next')}
              className="p-1.5 sm:p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Shift Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          {['morning', 'afternoon', 'night'].map((shift) => (
            <button
              key={shift}
              onClick={() => setActiveShift(shift)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeShift === shift
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              เวร{getShiftName(shift)}
            </button>
          ))}
        </div>
      </div>

             

      {/* Nurses Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden mb-6">
        <div className="bg-blue-100 text-blue-800 p-4 border-l-4 border-blue-400">
          <h3 className="text-xl font-semibold text-center">พยาบาล</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">เตียง</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[160px]">ชื่อเจ้าหน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[140px]">หน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">ERT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments[activeShift].nurses.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {canManageAssignments ? (
                      <select
                        value={assignment.bed}
                        onChange={(e) => updateNurseAssignment(activeShift, assignment.id, 'bed', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">เลือกเตียง</option>
                        {bedOptions && bedOptions.length > 0 ? bedOptions.map((bed) => (
                          <option key={bed.id} value={bed.name} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                            {bed.name}
                          </option>
                        )) : (
                          <option value="" disabled style={{ color: '#666666' }}>ไม่มีข้อมูลเตียง</option>
                        )}
                      </select>
                    ) : (
                      <div className="px-3 py-2 text-gray-800 font-medium">
                        {assignment.bed || 'ยังไม่ได้เลือก'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="px-3 py-2 text-gray-800 font-medium">
                      {(() => {
                        const member = teamMembers.find(m => m.id === assignment.memberId);
                        return member ? `${member.firstName} ${member.lastName}` : 'ไม่พบข้อมูล';
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canManageAssignments ? (
                      <select
                        value={assignment.duty}
                        onChange={(e) => updateNurseAssignment(activeShift, assignment.id, 'duty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">เลือกหน้าที่</option>
                        {dutyOptions && dutyOptions.length > 0 ? dutyOptions.map((duty) => (
                          <option key={duty.id} value={duty.name} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                            {duty.name}
                          </option>
                        )) : (
                          <option value="" disabled style={{ color: '#666666' }}>ไม่มีข้อมูลหน้าที่</option>
                        )}
                      </select>
                    ) : (
                      <div className="px-3 py-2 text-gray-800 font-medium">
                        {assignment.duty || 'ยังไม่ได้เลือก'}
                      </div>
                    )}
                  </td>
                                     <td className="px-4 py-3">
                     {canManageAssignments ? (
                       <select
                         value={assignment.ert}
                         onChange={(e) => updateNurseAssignment(activeShift, assignment.id, 'ert', e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">เลือก ERT</option>
                         {extraDutyOptions && extraDutyOptions.length > 0 ? extraDutyOptions.map((extraDuty) => (
                           <option key={extraDuty.id} value={extraDuty.name} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                             {extraDuty.name}
                           </option>
                         )) : (
                           <option value="" disabled style={{ color: '#666666' }}>ไม่มีข้อมูล ERT</option>
                         )}
                       </select>
                     ) : (
                       <div className="px-3 py-2 text-gray-800 font-medium">
                         {assignment.ert || 'ยังไม่ได้เลือก'}
                       </div>
                     )}
                   </td>

                </tr>
              ))}
              {assignments[activeShift].nurses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีพยาบาลในเวรนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assistants Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-green-200/50 overflow-hidden mb-6">
        <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-400">
          <h3 className="text-xl font-semibold text-center">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">ทีม</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">ชื่อเจ้าหน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">ERT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments[activeShift].assistants.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                                                       <td className="px-4 py-3">
                    {canManageAssignments ? (
                      <select
                        value={assignment.team}
                        onChange={(e) => updateAssistantAssignment(activeShift, assignment.id, 'team', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">เลือกทีม</option>
                        <option value="TEAM A" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                          TEAM A
                        </option>
                        <option value="TEAM B" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                          TEAM B
                        </option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 text-gray-800 font-medium">
                        {assignment.team || 'ยังไม่ได้เลือก'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="px-3 py-2 text-gray-800 font-medium">
                      {(() => {
                        const member = teamMembers.find(m => m.id === assignment.memberId);
                        return member ? `${member.firstName} ${member.lastName}` : 'ไม่พบข้อมูล';
                      })()}
                    </div>
                  </td>
                                                       <td className="px-4 py-3">
                    <div className="px-3 py-2 text-gray-800 font-medium">
                      {assignment.team === 'TEAM A' ? 'เคลื่อนย้ายกู้ชีพ' : 
                       assignment.team === 'TEAM B' ? 'ช่างและเส้นทาง' : 
                       'ยังไม่ได้เลือกทีม'}
                    </div>
                  </td>

                </tr>
              ))}
              {assignments[activeShift].assistants.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีผู้ช่วยในเวรนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      {canManageAssignments && (
        <div className="flex justify-end">
          <button
            onClick={saveAssignments}
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
              saving
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : saved
                ? 'bg-green-200 hover:bg-green-300 text-green-800 hover:scale-105'
                : 'bg-green-200 hover:bg-green-300 text-green-800 hover:scale-105'
            }`}
          >
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกตารางมอบหมายงาน'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Assignments;
