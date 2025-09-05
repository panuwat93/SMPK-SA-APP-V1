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

  useEffect(() => {
    if (userData?.department) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      console.log('Starting to fetch data...');
      await Promise.all([
        fetchTeamMembers(),
        fetchBedOptions(),
        fetchDutyOptions(),
        fetchExtraDutyOptions(),
        loadAssignments()
      ]);
      console.log('All data fetched successfully');
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
      
      console.log('Bed options doc exists:', bedOptionsDoc.exists());
      if (bedOptionsDoc.exists()) {
        const data = bedOptionsDoc.data();
        console.log('Bed options data:', data);
        const options = data.options || [];
        console.log('Bed options array:', options);
        setBedOptions(options);
      } else {
        console.log('No bed options document found');
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
      
      console.log('Duty options doc exists:', dutyOptionsDoc.exists());
      if (dutyOptionsDoc.exists()) {
        const data = dutyOptionsDoc.data();
        console.log('Duty options data:', data);
        const options = data.options || [];
        console.log('Duty options array:', options);
        setDutyOptions(options);
      } else {
        console.log('No duty options document found');
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
      
      console.log('Extra duty options doc exists:', extraDutyOptionsDoc.exists());
      if (extraDutyOptionsDoc.exists()) {
        const data = extraDutyOptionsDoc.data();
        console.log('Extra duty options data:', data);
        const options = data.options || [];
        console.log('Extra duty options array:', options);
        setExtraDutyOptions(options);
      } else {
        console.log('No extra duty options document found');
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

  const loadAssignments = async () => {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const assignmentsRef = doc(db, 'assignments', `${userData.department}-${dateKey}`);
      const assignmentsDoc = await getDoc(assignmentsRef);
      
      if (assignmentsDoc.exists()) {
        const data = assignmentsDoc.data();
        setAssignments(data.assignments || {
          morning: { nurses: [], assistants: [] },
          afternoon: { nurses: [], assistants: [] },
          night: { nurses: [], assistants: [] }
        });
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const saveAssignments = async () => {
    setSaving(true);
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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

  const addNurseAssignment = (shift) => {
    const newAssignment = {
      id: Date.now(),
      bed: '',
      memberId: '',
      duty: '',
      ert: ''
    };
    
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        nurses: [...prev[shift].nurses, newAssignment]
      }
    }));
  };

  const addAssistantAssignment = (shift) => {
    const newAssignment = {
      id: Date.now(),
      team: '',
      memberId: '',
      ert: ''
    };
    
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        assistants: [...prev[shift].assistants, newAssignment]
      }
    }));
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

  const removeNurseAssignment = (shift, assignmentId) => {
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        nurses: prev[shift].nurses.filter(assignment => assignment.id !== assignmentId)
      }
    }));
  };

  const removeAssistantAssignment = (shift, assignmentId) => {
    setAssignments(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        assistants: prev[shift].assistants.filter(assignment => assignment.id !== assignmentId)
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
      <style jsx>{`
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ตารางมอบหมายงาน</h1>
        <p className="text-gray-600">จัดการการมอบหมายงานให้พนักงานในแต่ละเวร</p>
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
         
         {/* Debug Information */}
         <div className="bg-blue-50 p-3 rounded-lg text-sm mb-4">
           <div className="font-medium text-blue-800 mb-2">ข้อมูล Debug:</div>
           <div>เตียง: {bedOptions.length} รายการ</div>
           <div>หน้าที่: {dutyOptions.length} รายการ</div>
           <div>ERT: {extraDutyOptions.length} รายการ</div>
           <div>พยาบาล: {getNurses().length} คน</div>
           <div>ผู้ช่วย: {getAssistants().length} คน</div>
           <div className="mt-2">
             <div>Bed Options: {JSON.stringify(bedOptions.slice(0, 2))}</div>
             <div>Duty Options: {JSON.stringify(dutyOptions.slice(0, 2))}</div>
             <div>Extra Duty Options: {JSON.stringify(extraDutyOptions.slice(0, 2))}</div>
           </div>
         </div>
       </div>

      {/* Nurses Table */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">พยาบาล</h3>
            <button
              onClick={() => addNurseAssignment(activeShift)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              เพิ่มพยาบาล
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เตียง</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อเจ้าหน้าที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">หน้าที่</th>
                                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ERT</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">จัดการ</th>
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
                    <select
                      value={assignment.memberId}
                      onChange={(e) => updateNurseAssignment(activeShift, assignment.id, 'memberId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">เลือกพยาบาล</option>
                      {getNurses().map((nurse) => (
                        <option key={nurse.id} value={nurse.id}>
                          {nurse.firstName} {nurse.lastName}
                        </option>
                      ))}
                    </select>
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeNurseAssignment(activeShift, assignment.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {assignments[activeShift].nurses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีข้อมูลพยาบาล
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้</h3>
            <button
              onClick={() => addAssistantAssignment(activeShift)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              เพิ่มผู้ช่วย
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ทีม</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อเจ้าหน้าที่</th>
                                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ERT</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">จัดการ</th>
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
                    <select
                      value={assignment.memberId}
                      onChange={(e) => updateAssistantAssignment(activeShift, assignment.id, 'memberId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">เลือกผู้ช่วย</option>
                      {getAssistants().map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.firstName} {assistant.lastName}
                        </option>
                      ))}
                    </select>
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeAssistantAssignment(activeShift, assignment.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {assignments[activeShift].assistants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีข้อมูลผู้ช่วย
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
