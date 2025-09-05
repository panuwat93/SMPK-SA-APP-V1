import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

  useEffect(() => {
    if (userData?.department) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchBedOptions(),
        fetchDutyOptions(),
        fetchExtraDutyOptions(),
        loadScheduleData(),
        loadAssignments()
      ]);
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

  const loadScheduleData = async (date = selectedDate) => {
    try {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      console.log('📅 loadScheduleData Debug:', {
        date: date.toLocaleDateString('th-TH'),
        monthKey,
        department: userData.department,
        docExists: scheduleDoc.exists()
      });
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        console.log('📊 Schedule Data loaded:', data);
        setScheduleData(data);
      } else {
        console.log('❌ No schedule data found for month:', monthKey);
        setScheduleData({});
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setScheduleData({});
    }
  };

  const loadAssignments = async (date = selectedDate) => {
    try {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const assignmentsRef = doc(db, 'assignments', `${userData.department}-${dateKey}`);
      const assignmentsDoc = await getDoc(assignmentsRef);
      
      console.log('📋 loadAssignments Debug:', {
        date: date.toLocaleDateString('th-TH'),
        dateKey,
        department: userData.department,
        docExists: assignmentsDoc.exists()
      });
      
      if (assignmentsDoc.exists()) {
        const data = assignmentsDoc.data();
        console.log('📊 Assignments Data loaded:', data);
        setAssignments(data.assignments || {
          morning: { nurses: [], assistants: [] },
          afternoon: { nurses: [], assistants: [] },
          night: { nurses: [], assistants: [] }
        });
      } else {
        console.log('❌ No assignments data found, generating from schedule...');
        // สร้างข้อมูลจากตารางเวร
        await generateAssignmentsFromSchedule(date);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const saveAssignments = async () => {
    setSaving(true);
    try {
      const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const assignmentsRef = doc(db, 'assignments', `${userData.department}-${dateKey}`);
      
      await setDoc(assignmentsRef, {
        department: userData.department,
        date: dateKey,
        assignments: assignments,
        savedAt: new Date(),
        savedBy: userData.username
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setSaving(false);
    }
  };



  const updateNurseAssignment = (shift, assignmentId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        nurses: prev[shift].nurses.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, [field]: value }
            : assignment
        )
      }
    }));
  };

  const updateAssistantAssignment = (shift, assignmentId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        assistants: prev[shift].assistants.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, [field]: value }
            : assignment
        )
      }
    }));
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

    console.log('🔍 generateAssignmentsFromSchedule Debug:', {
      date: date.toLocaleDateString('th-TH'),
      dayIndex,
      scheduleData,
      teamMembers: teamMembers.length
    });

    // ดึงเจ้าหน้าที่ที่มีเวรในวันที่เลือก
    teamMembers.forEach(member => {
      // ตรวจสอบข้อมูลจาก scheduleData.schedule
      const memberSchedule = scheduleData.schedule?.[member.id]?.[dayIndex];
      const topShift = memberSchedule?.top || '';
      const bottomShift = memberSchedule?.bottom || '';
      
      console.log(`👤 ${member.firstName} ${member.lastName} (${member.role}):`, {
        memberId: member.id,
        dayIndex,
        topShift,
        bottomShift,
        memberSchedule
      });
      
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
        console.log(`✅ เพิ่ม ${member.firstName} ในเวรเช้า`);
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
        console.log(`✅ เพิ่ม ${member.firstName} ในเวรบ่าย`);
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
        console.log(`✅ เพิ่ม ${member.firstName} ในเวรดึก`);
      }
    });

    console.log('📋 ผลลัพธ์สุดท้าย:', newAssignments);
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
    <div className="p-6 bg-gray-50 min-h-screen">
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
      `}</style>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold text-gray-800 text-center flex-1">ตารางมอบหมายงาน</h1>
          
          {/* Date Selector */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <button
              onClick={() => changeDate('prev')}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {formatDate(selectedDate)}
              </div>
            </div>
            
            <button
              onClick={() => changeDate('next')}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

             {/* Current Shift Display */}
       <div className="mb-6">
         <h2 className="text-2xl font-semibold text-gray-800 mb-4">
           เวร{getShiftName(activeShift)}
         </h2>
         

       </div>

      {/* Nurses Table */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">พยาบาล</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เตียง</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อเจ้าหน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">หน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ERT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments[activeShift].nurses.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
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
                  </td>
                                     <td className="px-4 py-3">
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
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ทีม</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อเจ้าหน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ERT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments[activeShift].assistants.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                                     <td className="px-4 py-3">
                     <select
                       value={assignment.team}
                       onChange={(e) => updateAssistantAssignment(activeShift, assignment.id, 'team', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">เลือกทีม</option>
                       {bedOptions && bedOptions.length > 0 ? bedOptions.map((bed) => (
                         <option key={bed.id} value={bed.name} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                           {bed.name}
                         </option>
                       )) : (
                         <option value="" disabled style={{ color: '#666666' }}>ไม่มีข้อมูลทีม</option>
                       )}
                     </select>
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
                     <select
                       value={assignment.ert}
                       onChange={(e) => updateAssistantAssignment(activeShift, assignment.id, 'ert', e.target.value)}
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
      <div className="flex justify-end">
        <button
          onClick={saveAssignments}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : saved
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกตารางมอบหมายงาน'}
        </button>
      </div>
    </div>
  );
};

export default Assignments;
