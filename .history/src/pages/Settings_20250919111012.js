import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const Settings = ({ userData }) => {
  const [activeMenu, setActiveMenu] = useState('team');
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [originalTeamMembers, setOriginalTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // สำหรับค้นหาเจ้าหน้าที่จากแผนกอื่น
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // สำหรับจัดการเตียง
  const [bedOptions, setBedOptions] = useState([]);
  const [newBedOption, setNewBedOption] = useState('');
  const [newBedForNurse, setNewBedForNurse] = useState(true);
  const [newBedForAssistant, setNewBedForAssistant] = useState(true);
  const [newBedDuty, setNewBedDuty] = useState('');
  const [newBedErt, setNewBedErt] = useState('');
  const [savingBeds, setSavingBeds] = useState(false);
  const [bedsSaved, setBedsSaved] = useState(false);
  
  // สำหรับจัดการหน้าที่
  const [dutyOptions, setDutyOptions] = useState([]);
  const [newDutyOption, setNewDutyOption] = useState('');
  const [savingDuties, setSavingDuties] = useState(false);
  const [dutiesSaved, setDutiesSaved] = useState(false);
  
  // สำหรับจัดการหน้าที่เสริม
  const [extraDutyOptions, setExtraDutyOptions] = useState([]);
  const [newExtraDutyOption, setNewExtraDutyOption] = useState('');
  const [savingExtraDuties, setSavingExtraDuties] = useState(false);
  const [extraDutiesSaved, setExtraDutiesSaved] = useState(false);

  // สำหรับจัดการอัตราค่าตอบแทน
  const [compensationRates, setCompensationRates] = useState({});
  const [savingCompensation, setSavingCompensation] = useState(false);
  const [compensationSaved, setCompensationSaved] = useState(false);

  // สำหรับจัดการตัวเลือกเวร
  const [shiftOptions, setShiftOptions] = useState([
    {
      id: 1,
      name: 'ช',
      description: 'เวรเช้า',
      type: 'normal',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 2,
      name: 'บ',
      description: 'เวรบ่าย',
      type: 'normal',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 3,
      name: 'ด',
      description: 'เวรดึก',
      type: 'normal',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 4,
      name: 'ก',
      description: 'เวรกลางวัน',
      type: 'normal',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 5,
      name: 'น',
      description: 'เวรกลางคืน',
      type: 'normal',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    }
  ]);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftDescription, setNewShiftDescription] = useState('');
  const [newShiftType, setNewShiftType] = useState('special'); // 'normal' หรือ 'special'
  const [newShiftTextColor, setNewShiftTextColor] = useState('#000000');
  const [newShiftBackgroundColor, setNewShiftBackgroundColor] = useState('#ffffff');
  const [savingShifts, setSavingShifts] = useState(false);
  const [shiftsSaved, setShiftsSaved] = useState(false);

  // สำหรับจัดการสิทธิ์
  const [permissions, setPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsSaved, setPermissionsSaved] = useState(false);

  // สำหรับจัดการเจ้าหน้าที่
  const [staffTypes, setStaffTypes] = useState({});
  const [savingStaffTypes, setSavingStaffTypes] = useState(false);
  const [staffTypesSaved, setStaffTypesSaved] = useState(false);

  useEffect(() => {
    if (userData?.department) {
      fetchUsers();
      fetchTeamMembers();
      fetchBedOptions();
      fetchDutyOptions();
      fetchExtraDutyOptions();
      fetchCompensationRates();
      fetchShiftOptions();
      fetchPermissions();
      fetchStaffTypes();
    }
  }, [userData]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('department', '==', userData.department));
      const querySnapshot = await getDocs(q);
      
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })); // แสดงทุกคนในแผนก รวมทั้ง Admin

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // ค้นหาเจ้าหน้าที่จากแผนกอื่น
  const searchUsersFromOtherDepartments = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const allUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // กรองเฉพาะคนที่ไม่อยู่ในแผนกเดียวกัน และชื่อตรงกับคำค้นหา
      const filteredUsers = allUsers.filter(user => {
        const isNotSameDepartment = user.department !== userData.department;
        const matchesSearch = 
          user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(query.toLowerCase()) ||
          user.username?.toLowerCase().includes(query.toLowerCase());
        
        return isNotSameDepartment && matchesSearch;
      });

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // จัดการการเปลี่ยนแปลงคำค้นหา
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsersFromOtherDepartments(query);
  };

  const fetchTeamMembers = async () => {
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const members = teamDoc.data().members || [];
        setTeamMembers(members);
        setOriginalTeamMembers(members);
        setSaved(members.length > 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team:', error);
      setLoading(false);
    }
  };

  const fetchBedOptions = async () => {
    try {
      const bedOptionsRef = doc(db, 'bedOptions', userData.department);
      const bedOptionsDoc = await getDoc(bedOptionsRef);
      
      if (bedOptionsDoc.exists()) {
        const options = bedOptionsDoc.data().options || [];
        // รองรับรูปแบบเก่า (string) และแปลงเป็น object พร้อมธงกลุ่มผู้ใช้
        const normalized = options.map((opt, index) => {
          if (typeof opt === 'string') {
            return { 
              id: index + 1, 
              name: opt, 
              forNurse: true, 
              forAssistant: true,
              duty: '',
              ert: ''
            };
          }
          return {
            id: opt.id || index + 1,
            name: opt.name || String(opt),
            forNurse: opt.forNurse !== false,
            forAssistant: opt.forAssistant !== false,
            duty: opt.duty || '',
            ert: opt.ert || ''
          };
        });
        setBedOptions(normalized);
        setBedsSaved(options.length > 0);
      }
    } catch (error) {
      console.error('Error fetching bed options:', error);
    }
  };

  const fetchDutyOptions = async () => {
    try {
      const dutyOptionsRef = doc(db, 'dutyOptions', userData.department);
      const dutyOptionsDoc = await getDoc(dutyOptionsRef);
      
      if (dutyOptionsDoc.exists()) {
        const options = dutyOptionsDoc.data().options || [];
        console.log('Duty options loaded:', options);
        setDutyOptions(options);
        setDutiesSaved(options.length > 0);
      } else {
        console.log('No duty options found for department:', userData.department);
        setDutyOptions([]);
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
        const options = extraDutyOptionsDoc.data().options || [];
        console.log('Extra duty options loaded:', options);
        setExtraDutyOptions(options);
        setExtraDutiesSaved(options.length > 0);
      } else {
        console.log('No extra duty options found for department:', userData.department);
        setExtraDutyOptions([]);
      }
    } catch (error) {
      console.error('Error fetching extra duty options:', error);
      setExtraDutyOptions([]);
    }
  };

  const fetchCompensationRates = async () => {
    try {
      const compensationRef = doc(db, 'compensationRates', userData.department);
      const compensationDoc = await getDoc(compensationRef);
      
      if (compensationDoc.exists()) {
        const rates = compensationDoc.data().rates || {};
        setCompensationRates(rates);
        setCompensationSaved(Object.keys(rates).length > 0);
      }
    } catch (error) {
      console.error('Error fetching compensation rates:', error);
    }
  };

  const fetchShiftOptions = async () => {
    try {
      const shiftOptionsRef = doc(db, 'shiftOptions', userData.department);
      const shiftOptionsDoc = await getDoc(shiftOptionsRef);
      
      if (shiftOptionsDoc.exists()) {
        const options = shiftOptionsDoc.data().options || [];
        setShiftOptions(options);
        setShiftsSaved(options.length > 0);
      }
    } catch (error) {
      console.error('Error fetching shift options:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const permissionsRef = doc(db, 'permissions', userData.department);
      const permissionsDoc = await getDoc(permissionsRef);
      
      if (permissionsDoc.exists()) {
        const permissionsData = permissionsDoc.data().permissions || {};
        setPermissions(permissionsData);
        setPermissionsSaved(Object.keys(permissionsData).length > 0);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchStaffTypes = async () => {
    try {
      const staffTypesRef = doc(db, 'staffTypes', userData.department);
      const staffTypesDoc = await getDoc(staffTypesRef);
      
      if (staffTypesDoc.exists()) {
        const types = staffTypesDoc.data().types || {};
        setStaffTypes(types);
        setStaffTypesSaved(Object.keys(types).length > 0);
      }
    } catch (error) {
      console.error('Error fetching staff types:', error);
    }
  };

  const addToTeam = (user) => {
    if (!teamMembers.find(member => member.id === user.id)) {
      const newMember = {
        ...user,
        order: teamMembers.length + 1
      };
      setTeamMembers([...teamMembers, newMember]);
      setSaved(false);
      
      // ล้างช่องค้นหาหลังจากเพิ่มเจ้าหน้าที่
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeFromTeam = (userId) => {
    const updatedMembers = teamMembers
      .filter(member => member.id !== userId)
      .map((member, index) => ({ ...member, order: index + 1 }));
    setTeamMembers(updatedMembers);
    setSaved(false);
  };

  const moveUp = (index) => {
    if (index > 0) {
      const updatedMembers = [...teamMembers];
      [updatedMembers[index], updatedMembers[index - 1]] = [updatedMembers[index - 1], updatedMembers[index]];
      updatedMembers.forEach((member, idx) => {
        member.order = idx + 1;
      });
      setTeamMembers(updatedMembers);
      setSaved(false);
    }
  };

  const moveDown = (index) => {
    if (index < teamMembers.length - 1) {
      const updatedMembers = [...teamMembers];
      [updatedMembers[index], updatedMembers[index + 1]] = [updatedMembers[index + 1], updatedMembers[index]];
      updatedMembers.forEach((member, idx) => {
        member.order = idx + 1;
      });
      setTeamMembers(updatedMembers);
      setSaved(false);
    }
  };

  const saveTeam = async () => {
    setSaving(true);
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamData = {
        department: userData.department,
        supervisorId: userData.uid,
        supervisorName: `${userData.firstName} ${userData.lastName}`,
        members: teamMembers,
        updatedAt: new Date()
      };
      
      await setDoc(teamRef, teamData);
      setOriginalTeamMembers([...teamMembers]);
      setSaved(true);
      alert('บันทึกทีมเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving team:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSaving(false);
  };

  // ฟังก์ชันสำหรับจัดการเตียง
  const addBedOption = () => {
    const name = newBedOption.trim();
    if (!name) return;
    const exists = bedOptions.some(b => (b.name || b) === name);
    if (exists) return;
    const newItem = {
      id: Date.now(),
      name,
      forNurse: newBedForNurse,
      forAssistant: newBedForAssistant,
      duty: newBedDuty,
      ert: newBedErt
    };
    setBedOptions([...bedOptions, newItem]);
    setNewBedOption('');
    setNewBedForNurse(true);
    setNewBedForAssistant(true);
    setNewBedDuty('');
    setNewBedErt('');
    setBedsSaved(false);
  };

  const removeBedOption = (index) => {
    const updatedOptions = bedOptions.filter((_, i) => i !== index);
    setBedOptions(updatedOptions);
    setBedsSaved(false);
  };

  const saveBedOptions = async () => {
    setSavingBeds(true);
    try {
      const bedOptionsRef = doc(db, 'bedOptions', userData.department);
      await setDoc(bedOptionsRef, {
        department: userData.department,
        options: bedOptions.map((b, index) => (
          typeof b === 'string' ? { id: index + 1, name: b, forNurse: true, forAssistant: true } : b
        )),
        updatedAt: new Date()
      });
      setBedsSaved(true);
      alert('บันทึกตัวเลือกเตียงเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving bed options:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingBeds(false);
  };

  // ฟังก์ชันสำหรับจัดการหน้าที่
  const addDutyOption = () => {
    if (newDutyOption.trim() && !dutyOptions.includes(newDutyOption.trim())) {
      setDutyOptions([...dutyOptions, newDutyOption.trim()]);
      setNewDutyOption('');
      setDutiesSaved(false);
    }
  };

  const removeDutyOption = (index) => {
    const updatedOptions = dutyOptions.filter((_, i) => i !== index);
    setDutyOptions(updatedOptions);
    setDutiesSaved(false);
  };

  const saveDutyOptions = async () => {
    setSavingDuties(true);
    try {
      const dutyOptionsRef = doc(db, 'dutyOptions', userData.department);
      await setDoc(dutyOptionsRef, {
        department: userData.department,
        options: dutyOptions,
        updatedAt: new Date()
      });
      setDutiesSaved(true);
      alert('บันทึกตัวเลือกหน้าที่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving duty options:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingDuties(false);
  };

  // ฟังก์ชันสำหรับจัดการหน้าที่เสริม
  const addExtraDutyOption = () => {
    if (newExtraDutyOption.trim() && !extraDutyOptions.includes(newExtraDutyOption.trim())) {
      setExtraDutyOptions([...extraDutyOptions, newExtraDutyOption.trim()]);
      setNewExtraDutyOption('');
      setExtraDutiesSaved(false);
    }
  };

  const removeExtraDutyOption = (index) => {
    const updatedOptions = extraDutyOptions.filter((_, i) => i !== index);
    setExtraDutyOptions(updatedOptions);
    setExtraDutiesSaved(false);
  };

  const saveExtraDutyOptions = async () => {
    setSavingExtraDuties(true);
    try {
      const extraDutyOptionsRef = doc(db, 'extraDutyOptions', userData.department);
      await setDoc(extraDutyOptionsRef, {
        department: userData.department,
        options: extraDutyOptions,
        updatedAt: new Date()
      });
      setExtraDutiesSaved(true);
             alert('บันทึกตัวเลือกหน้าที่ ERT เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving extra duty options:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingExtraDuties(false);
  };

  // ฟังก์ชันสำหรับจัดการอัตราค่าตอบแทน
  const updateCompensationRate = (userId, field, value) => {
    const newRates = { ...compensationRates };
    if (!newRates[userId]) {
      newRates[userId] = { monthlyOT: 0, shiftAllowance: 0, dailyOT: 0, dailyShift: 0 };
    }
    newRates[userId][field] = parseFloat(value) || 0;
    setCompensationRates(newRates);
    setCompensationSaved(false);
  };

  // ฟังก์ชันสำหรับจัดการประเภทเจ้าหน้าที่
  const updateStaffType = (userId, staffType) => {
    const newStaffTypes = { ...staffTypes };
    newStaffTypes[userId] = staffType;
    setStaffTypes(newStaffTypes);
    
    // ล้างค่าเงินในช่องที่ไม่เกี่ยวข้องตามประเภทพนักงาน
    const newRates = { ...compensationRates };
    if (!newRates[userId]) {
      newRates[userId] = { monthlyOT: 0, shiftAllowance: 0, dailyOT: 0, dailyShift: 0 };
    }
    
    if (staffType === 'monthly') {
      // ถ้าเป็นรายเดือน ล้างค่าเงินรายวัน
      newRates[userId].dailyOT = 0;
      newRates[userId].dailyShift = 0;
    } else if (staffType === 'daily') {
      // ถ้าเป็นรายวัน ล้างค่าเงิน OT รายเดือน
      newRates[userId].monthlyOT = 0;
    }
    
    setCompensationRates(newRates);
    setStaffTypesSaved(false);
    setCompensationSaved(false); // เพื่อให้ปุ่มบันทึกเปิดใช้งาน
  };

  const saveCompensationRates = async () => {
    setSavingCompensation(true);
    try {
      // บันทึกอัตราค่าตอบแทน
      const compensationRef = doc(db, 'compensationRates', userData.department);
      await setDoc(compensationRef, {
        department: userData.department,
        rates: compensationRates,
        updatedAt: new Date()
      });

      // บันทึกประเภทพนักงาน
      const staffTypesRef = doc(db, 'staffTypes', userData.department);
      await setDoc(staffTypesRef, {
        department: userData.department,
        types: staffTypes,
        updatedAt: new Date()
      });

      setCompensationSaved(true);
      setStaffTypesSaved(true);
      alert('บันทึกอัตราค่าตอบแทนและประเภทพนักงานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving compensation rates:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingCompensation(false);
  };

  // ฟังก์ชันสำหรับจัดการตัวเลือกเวร
  const addShiftOption = () => {
    if (newShiftName.trim()) {
      const newShift = {
        id: Date.now(),
        name: newShiftName.trim(),
        description: newShiftDescription.trim(),
        type: newShiftType,
        includeInTeam: false,
        textColor: newShiftType === 'special' ? newShiftTextColor : '#000000',
        backgroundColor: newShiftType === 'special' ? newShiftBackgroundColor : '#ffffff'
      };
      setShiftOptions([...shiftOptions, newShift]);
      setNewShiftName('');
      setNewShiftDescription('');
      setNewShiftType('special');
      setNewShiftTextColor('#000000');
      setNewShiftBackgroundColor('#ffffff');
      setShiftsSaved(false);
    }
  };

  const removeShiftOption = (id) => {
    const updatedOptions = shiftOptions.filter(option => option.id !== id);
    setShiftOptions(updatedOptions);
    setShiftsSaved(false);
  };

  const toggleIncludeInTeam = (id) => {
    const updatedOptions = shiftOptions.map(option => {
      if (option.id === id) {
        // ถ้าเป็นเวรธรรมดา ให้บังคับเปิด "นับในสรุป" เสมอ
        if (option.type === 'normal') {
          return { ...option, includeInTeam: true };
        }
        // ถ้าเป็นเวรพิเศษ ให้สลับตามปกติ
        return { ...option, includeInTeam: !option.includeInTeam };
      }
      return option;
    });
    setShiftOptions(updatedOptions);
    setShiftsSaved(false);
  };

  const updateShiftColor = (id, field, value) => {
    const updatedOptions = shiftOptions.map(option => {
      if (option.id === id) {
        // ถ้าเป็นเวรธรรมดา ให้บังคับใช้สีเริ่มต้น
        if (option.type === 'normal') {
          return {
            ...option,
            textColor: '#000000',
            backgroundColor: '#ffffff'
          };
        }
        // ถ้าเป็นเวรพิเศษ ให้ใช้สีที่เลือก
        return { ...option, [field]: value };
      }
      return option;
    });
    setShiftOptions(updatedOptions);
    setShiftsSaved(false);
  };



  const saveShiftOptions = async () => {
    setSavingShifts(true);
    try {
      const shiftOptionsRef = doc(db, 'shiftOptions', userData.department);
      await setDoc(shiftOptionsRef, {
        department: userData.department,
        options: shiftOptions,
        updatedAt: new Date()
      });
      setShiftsSaved(true);
      alert('บันทึกตัวเลือกเวรเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving shift options:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingShifts(false);
  };

  // ฟังก์ชันสำหรับจัดการสิทธิ์
  const updatePermission = (userId, permissionType, value) => {
    const newPermissions = { ...permissions };
    if (!newPermissions[userId]) {
      newPermissions[userId] = { editSchedule: false, manageAssignments: false };
    }
    newPermissions[userId][permissionType] = value;
    setPermissions(newPermissions);
    setPermissionsSaved(false);
  };

  const savePermissions = async () => {
    setSavingPermissions(true);
    try {
      const permissionsRef = doc(db, 'permissions', userData.department);
      await setDoc(permissionsRef, {
        department: userData.department,
        permissions: permissions,
        updatedAt: new Date()
      });
      setPermissionsSaved(true);
      alert('บันทึกสิทธิ์เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingPermissions(false);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ตั้งค่า</h1>
      
      <div className="flex gap-8">
        {/* เมนูด้านซ้าย */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">เมนูการตั้งค่า</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveMenu('team')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === 'team'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                จัดการทีม
              </button>
              <button
                onClick={() => setActiveMenu('beds')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === 'beds'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                จัดการเตียง
              </button>
              <button
                onClick={() => setActiveMenu('duties')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === 'duties'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                จัดการหน้าที่
              </button>
                             <button
                 onClick={() => setActiveMenu('extraDuties')}
                 className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                   activeMenu === 'extraDuties'
                     ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                     : 'text-gray-700 hover:bg-gray-100'
                 }`}
               >
                 จัดการหน้าที่ ERT
               </button>
                               <button
                  onClick={() => setActiveMenu('compensation')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeMenu === 'compensation'
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  อัตราค่าตอบแทน
                </button>
                <button
                  onClick={() => setActiveMenu('shiftOptions')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeMenu === 'shiftOptions'
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ตัวเลือกเวร
                </button>
                              <button
                onClick={() => setActiveMenu('permissions')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === 'permissions'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                จัดการสิทธิ์
              </button>
            </div>
          </div>
        </div>

        {/* เนื้อหาด้านขวา */}
        <div className="flex-1">
          {activeMenu === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* รายชื่อทั้งหมดในแผนก */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  รายชื่อทั้งหมดในแผนก {userData.department}
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg flex items-center justify-between ${
                        teamMembers.find(member => member.id === user.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{user.role}</div>
                      </div>
                      {teamMembers.find(member => member.id === user.id) ? (
                        <div className="flex items-center text-blue-600">
                          <CheckIcon className="w-5 h-5 mr-2" />
                          <span className="text-sm">อยู่ในทีมแล้ว</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToTeam(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          เพิ่มเข้าทีม
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* จัดการทีม */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  จัดการทีม ({teamMembers.length} คน)
                </h2>
                
                {/* ช่องค้นหาเจ้าหน้าที่จากแผนกอื่น */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มเจ้าหน้าที่จากแผนกอื่น</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="พิมพ์ชื่อเจ้าหน้าที่เพื่อค้นหา (อย่างน้อย 2 ตัวอักษร)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* แสดงผลการค้นหา */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-800">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.role} - {user.department}
                            </div>
                          </div>
                          <button
                            onClick={() => addToTeam(user)}
                            disabled={teamMembers.some(member => member.id === user.id)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              teamMembers.some(member => member.id === user.id)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {teamMembers.some(member => member.id === user.id) ? 'เพิ่มแล้ว' : 'เพิ่ม'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="mt-3 text-center text-gray-500 py-4">
                      ไม่พบเจ้าหน้าที่ที่ตรงกับคำค้นหา
                    </div>
                  )}
                </div>
                
                {teamMembers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    ยังไม่มีคนในทีม
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {teamMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                              {member.order}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded ${
                                index === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <ChevronUpIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => moveDown(index)}
                              disabled={index === teamMembers.length - 1}
                              className={`p-1 rounded ${
                                index === teamMembers.length - 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <ChevronDownIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => removeFromTeam(member.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">
                    ลำดับที่ 1 จะแสดงเป็นคนแรกในตารางเวร
                  </div>
                  <button
                    onClick={saveTeam}
                    disabled={saving || teamMembers.length === 0 || saved}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      saving || teamMembers.length === 0 || saved
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกทีม'}
                  </button>
                </div>
              </div>
            </div>
          )}

                                {/* เมนูจัดการเตียง */}
           {activeMenu === 'beds' && (
             <div className="bg-white rounded-lg shadow-md p-6">
              {/* เพิ่มตัวเลือกเตียงใหม่ */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มตัวเลือกเตียงใหม่</h3>
                <div className="space-y-4">
                  {/* ชื่อเตียง */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newBedOption}
                      onChange={(e) => setNewBedOption(e.target.value)}
                      placeholder="พิมพ์ชื่อเตียง เช่น เตียง 1, เตียง 2, ICU 1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addBedOption()}
                    />
                    <button
                      onClick={addBedOption}
                      disabled={!newBedOption.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      เพิ่ม
                    </button>
                  </div>
                  
                  {/* Checkbox สำหรับพยาบาลและผู้ช่วย */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={newBedForNurse} 
                        onChange={(e) => setNewBedForNurse(e.target.checked)} 
                      />
                      พยาบาล
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={newBedForAssistant} 
                        onChange={(e) => setNewBedForAssistant(e.target.checked)} 
                      />
                      ผู้ช่วยฯ
                    </label>
                  </div>
                  
                  {/* เลือกหน้าที่ (สำหรับพยาบาล) */}
                  {newBedForNurse && (
                    <div className="flex gap-3">
                      <label className="text-sm text-gray-700 min-w-[60px] flex items-center">หน้าที่:</label>
                      <select
                        value={newBedDuty}
                        onChange={(e) => setNewBedDuty(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        style={{ color: '#000000' }}
                      >
                        <option value="">เลือกหน้าที่</option>
                        {dutyOptions && dutyOptions.length > 0 ? dutyOptions.map((duty, index) => (
                          <option key={duty.id || `duty-${index}`} value={duty.name}>
                            {duty.name}
                          </option>
                        )) : (
                          <option key="no-duty" value="" disabled>ไม่มีข้อมูลหน้าที่ (จำนวน: {dutyOptions ? dutyOptions.length : 'null'})</option>
                        )}
                      </select>
                    </div>
                  )}
                  
                  {/* เลือก ERT */}
                  <div className="flex gap-3">
                    <label className="text-sm text-gray-700 min-w-[60px] flex items-center">ERT:</label>
                      <select
                        value={newBedErt}
                        onChange={(e) => setNewBedErt(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        style={{ color: '#000000' }}
                      >
                        <option value="">เลือก ERT</option>
                        {extraDutyOptions && extraDutyOptions.length > 0 ? extraDutyOptions.map((ert, index) => (
                          <option key={ert.id || `ert-${index}`} value={ert.name}>
                            {ert.name}
                          </option>
                        )) : (
                          <option key="no-ert" value="" disabled>ไม่มีข้อมูล ERT</option>
                        )}
                      </select>
                  </div>
                </div>
              </div>

              {/* แสดงตัวเลือกเตียงที่มีอยู่ */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">ตัวเลือกเตียงที่มีอยู่ ({bedOptions.length} รายการ)</h3>
                {bedOptions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    ยังไม่มีตัวเลือกเตียง
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bedOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-800 font-medium">{typeof option === 'string' ? option : option.name}</span>
                          <button
                            onClick={() => removeBedOption(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Checkbox สำหรับพยาบาลและผู้ช่วย */}
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={typeof option === 'string' ? true : option.forNurse !== false}
                                onChange={(e) => {
                                  const updated = [...bedOptions];
                                  const obj = typeof option === 'string' ? { 
                                    id: Date.now(), 
                                    name: option, 
                                    forNurse: e.target.checked, 
                                    forAssistant: true,
                                    duty: '',
                                    ert: ''
                                  } : { ...option, forNurse: e.target.checked };
                                  updated[index] = obj;
                                  setBedOptions(updated);
                                  setBedsSaved(false);
                                }}
                              />
                              พยาบาล
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={typeof option === 'string' ? true : option.forAssistant !== false}
                                onChange={(e) => {
                                  const updated = [...bedOptions];
                                  const obj = typeof option === 'string' ? { 
                                    id: Date.now(), 
                                    name: option, 
                                    forNurse: true, 
                                    forAssistant: e.target.checked,
                                    duty: '',
                                    ert: ''
                                  } : { ...option, forAssistant: e.target.checked };
                                  updated[index] = obj;
                                  setBedOptions(updated);
                                  setBedsSaved(false);
                                }}
                              />
                              ผู้ช่วยฯ
                            </label>
                          </div>
                          
                          {/* แสดงหน้าที่และ ERT */}
                          <div className="space-y-2">
                            {/* หน้าที่ (สำหรับพยาบาล) */}
                            {(typeof option === 'string' ? true : option.forNurse !== false) && (
                              <div className="flex gap-2">
                                <label className="text-sm text-gray-700 min-w-[50px]">หน้าที่:</label>
                                <select
                                  value={typeof option === 'string' ? '' : option.duty || ''}
                                  onChange={(e) => {
                                    const updated = [...bedOptions];
                                    const obj = typeof option === 'string' ? { 
                                      id: Date.now(), 
                                      name: option, 
                                      forNurse: true, 
                                      forAssistant: true,
                                      duty: e.target.value,
                                      ert: ''
                                    } : { ...option, duty: e.target.value };
                                    updated[index] = obj;
                                    setBedOptions(updated);
                                    setBedsSaved(false);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                  style={{ color: '#000000' }}
                                >
                                  <option value="">เลือกหน้าที่</option>
                                  {dutyOptions && dutyOptions.length > 0 ? dutyOptions.map((duty, index) => (
                                    <option key={duty.id || `duty-edit-${index}`} value={duty.name}>
                                      {duty.name}
                                    </option>
                                  )) : (
                                    <option key="no-duty-edit" value="" disabled>ไม่มีข้อมูลหน้าที่</option>
                                  )}
                                </select>
                              </div>
                            )}
                            
                            {/* ERT */}
                            <div className="flex gap-2">
                              <label className="text-sm text-gray-700 min-w-[50px]">ERT:</label>
                              <select
                                value={typeof option === 'string' ? '' : option.ert || ''}
                                onChange={(e) => {
                                  const updated = [...bedOptions];
                                  const obj = typeof option === 'string' ? { 
                                    id: Date.now(), 
                                    name: option, 
                                    forNurse: true, 
                                    forAssistant: true,
                                    duty: '',
                                    ert: e.target.value
                                  } : { ...option, ert: e.target.value };
                                  updated[index] = obj;
                                  setBedOptions(updated);
                                  setBedsSaved(false);
                                }}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                style={{ color: '#000000' }}
                              >
                                <option value="">เลือก ERT</option>
                                {extraDutyOptions && extraDutyOptions.length > 0 ? extraDutyOptions.map((ert, index) => (
                                  <option key={ert.id || `ert-edit-${index}`} value={ert.name}>
                                    {ert.name}
                                  </option>
                                )) : (
                                  <option key="no-ert-edit" value="" disabled>ไม่มีข้อมูล ERT</option>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ปุ่มบันทึก */}
              <div className="flex justify-end">
                <button
                  onClick={saveBedOptions}
                  disabled={savingBeds || bedOptions.length === 0 || bedsSaved}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    savingBeds || bedOptions.length === 0 || bedsSaved
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {savingBeds ? 'กำลังบันทึก...' : bedsSaved ? 'บันทึกแล้ว' : 'บันทึกตัวเลือกเตียง'}
                </button>
              </div>
            </div>
          )}

                                             {/* เมนูจัดการหน้าที่ */}
            {activeMenu === 'duties' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* เพิ่มตัวเลือกหน้าที่ใหม่ */}
               <div className="mb-6">
                 <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มตัวเลือกหน้าที่ใหม่</h3>
                 <div className="flex gap-3">
                   <input
                     type="text"
                     value={newDutyOption}
                     onChange={(e) => setNewDutyOption(e.target.value)}
                     placeholder="พิมพ์ชื่อหน้าที่ เช่น ดูแลผู้ป่วย, จัดการยา, บันทึกข้อมูล"
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     onKeyPress={(e) => e.key === 'Enter' && addDutyOption()}
                   />
                   <button
                     onClick={addDutyOption}
                     disabled={!newDutyOption.trim()}
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     เพิ่ม
                   </button>
                 </div>
               </div>

               {/* แสดงตัวเลือกหน้าที่ที่มีอยู่ */}
               <div className="mb-6">
                 <h3 className="text-lg font-medium text-gray-800 mb-3">ตัวเลือกหน้าที่ที่มีอยู่ ({dutyOptions.length} รายการ)</h3>
                 {dutyOptions.length === 0 ? (
                   <div className="text-center text-gray-500 py-8">
                     ยังไม่มีตัวเลือกหน้าที่
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {dutyOptions.map((option, index) => (
                       <div
                         key={index}
                         className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between"
                       >
                         <span className="text-gray-800">{option}</span>
                         <button
                           onClick={() => removeDutyOption(index)}
                           className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                         >
                           ลบ
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* ปุ่มบันทึก */}
               <div className="flex justify-end">
                 <button
                   onClick={saveDutyOptions}
                   disabled={savingDuties || dutyOptions.length === 0 || dutiesSaved}
                   className={`px-6 py-2 rounded-md text-white font-medium ${
                     savingDuties || dutyOptions.length === 0 || dutiesSaved
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-green-600 hover:bg-green-700'
                   }`}
                 >
                   {savingDuties ? 'กำลังบันทึก...' : dutiesSaved ? 'บันทึกแล้ว' : 'บันทึกตัวเลือกหน้าที่'}
                 </button>
               </div>
             </div>
           )}

                                 {/* เมนูจัดการหน้าที่ ERT */}
            {activeMenu === 'extraDuties' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                                {/* เพิ่มตัวเลือกหน้าที่ ERT ใหม่ */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มตัวเลือกหน้าที่ ERT ใหม่</h3>
                 <div className="flex gap-3">
                   <input
                     type="text"
                     value={newExtraDutyOption}
                     onChange={(e) => setNewExtraDutyOption(e.target.value)}
                     placeholder="พิมพ์ชื่อหน้าที่ ERT เช่น ดูแลเครื่องมือ, จัดการเอกสาร, ตรวจสอบอุปกรณ์"
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     onKeyPress={(e) => e.key === 'Enter' && addExtraDutyOption()}
                   />
                   <button
                     onClick={addExtraDutyOption}
                     disabled={!newExtraDutyOption.trim()}
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     เพิ่ม
                   </button>
                 </div>
               </div>

                               {/* แสดงตัวเลือกหน้าที่ ERT ที่มีอยู่ */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">ตัวเลือกหน้าที่ ERT ที่มีอยู่ ({extraDutyOptions.length} รายการ)</h3>
                  {extraDutyOptions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      ยังไม่มีตัวเลือกหน้าที่ ERT
                    </div>
                 ) : (
                   <div className="space-y-2">
                     {extraDutyOptions.map((option, index) => (
                       <div
                         key={index}
                         className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between"
                       >
                         <span className="text-gray-800">{option}</span>
                         <button
                           onClick={() => removeExtraDutyOption(index)}
                           className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                         >
                           ลบ
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* ปุ่มบันทึก */}
               <div className="flex justify-end">
                 <button
                   onClick={saveExtraDutyOptions}
                   disabled={savingExtraDuties || extraDutyOptions.length === 0 || extraDutiesSaved}
                   className={`px-6 py-2 rounded-md text-white font-medium ${
                     savingExtraDuties || extraDutyOptions.length === 0 || extraDutiesSaved
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-green-600 hover:bg-green-700'
                   }`}
                                    >
                     {savingExtraDuties ? 'กำลังบันทึก...' : extraDutiesSaved ? 'บันทึกแล้ว' : 'บันทึกตัวเลือกหน้าที่ ERT'}
                                     </button>
                </div>
              </div>
            )}

            {/* เมนูอัตราค่าตอบแทน */}
            {activeMenu === 'compensation' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">ตั้งค่าอัตราค่าตอบแทนรายบุคคล</h3>
                  <p className="text-gray-600 mb-4">กำหนดอัตราค่าตอบแทนสำหรับแต่ละคนในทีม</p>
                  
                  {teamMembers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-6xl mb-4">👥</div>
                      <h4 className="text-xl font-medium mb-2">ยังไม่มีคนในทีม</h4>
                      <p>กรุณาเพิ่มคนในทีมก่อนในเมนู "จัดการทีม"</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              ลำดับ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-48">
                              ชื่อ-นามสกุล
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-48">
                              ตำแหน่ง
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-32">
                              ประเภทพนักงาน
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-28">
                              เวร OT รายเดือน
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-28">
                              ค่าเวร(รายวัน/รายเดือน)
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-28">
                              เวร OT รายวัน
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-28">
                              เวรรายวัน
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {teamMembers.map((member, index) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900 border-b">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 border-b w-48">
                                {member.firstName} {member.lastName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 border-b w-48">
                                {member.role}
                              </td>
                              <td className="px-4 py-4 text-center border-b w-32">
                                <div className="flex justify-center space-x-3">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`staffType_${member.id}`}
                                      value="monthly"
                                      checked={staffTypes[member.id] === 'monthly'}
                                      onChange={(e) => updateStaffType(member.id, e.target.value)}
                                      className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-1 text-xs text-gray-700">เดือน</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`staffType_${member.id}`}
                                      value="daily"
                                      checked={staffTypes[member.id] === 'daily'}
                                      onChange={(e) => updateStaffType(member.id, e.target.value)}
                                      className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-1 text-xs text-gray-700">วัน</span>
                                  </label>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center border-b w-28">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={compensationRates[member.id]?.monthlyOT || 0}
                                  onChange={(e) => updateCompensationRate(member.id, 'monthlyOT', e.target.value)}
                                  disabled={staffTypes[member.id] === 'daily'}
                                  className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                    staffTypes[member.id] === 'daily' 
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'border-gray-300'
                                  }`}
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-4 py-4 text-center border-b w-28">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={compensationRates[member.id]?.shiftAllowance || 0}
                                  onChange={(e) => updateCompensationRate(member.id, 'shiftAllowance', e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-4 py-4 text-center border-b w-28">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={compensationRates[member.id]?.dailyOT || 0}
                                  onChange={(e) => updateCompensationRate(member.id, 'dailyOT', e.target.value)}
                                  disabled={staffTypes[member.id] === 'monthly'}
                                  className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                    staffTypes[member.id] === 'monthly' 
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'border-gray-300'
                                  }`}
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-4 py-4 text-center border-b w-28">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={compensationRates[member.id]?.dailyShift || 0}
                                  onChange={(e) => updateCompensationRate(member.id, 'dailyShift', e.target.value)}
                                  disabled={staffTypes[member.id] === 'monthly'}
                                  className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                    staffTypes[member.id] === 'monthly' 
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'border-gray-300'
                                  }`}
                                  placeholder="0.00"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ปุ่มบันทึก */}
                {teamMembers.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={saveCompensationRates}
                      disabled={savingCompensation || compensationSaved}
                      className={`px-6 py-2 rounded-md text-white font-medium ${
                        savingCompensation || compensationSaved
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {savingCompensation ? 'กำลังบันทึก...' : compensationSaved ? 'บันทึกแล้ว' : 'บันทึกอัตราค่าตอบแทน'}
                    </button>
                  </div>
                )}
               </div>
             )}

             {/* เมนูตัวเลือกเวร */}
             {activeMenu === 'shiftOptions' && (
               <div className="bg-white rounded-lg shadow-md p-6">

                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มตัวเลือกเวรใหม่</h3>
                   <p className="text-gray-600 mb-4">เวรที่เปิด "นับในสรุป" จะถูกนับรวมในแถวสรุปของตารางเวร</p>
                   <div className="grid grid-cols-5 gap-4 mb-4">
                     <div className="col-span-1">
                       <label className="block text-sm font-medium text-gray-700 mb-2">เวร</label>
                       <input
                         type="text"
                         value={newShiftName}
                         onChange={(e) => setNewShiftName(e.target.value)}
                         placeholder="เช่น ช, บ, ด"
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                     <div className="col-span-1">
                       <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทเวร</label>
                       <select
                         value={newShiftType}
                         onChange={(e) => setNewShiftType(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="normal">เวรธรรมดา</option>
                         <option value="special">เวรพิเศษ</option>
                       </select>
                     </div>
                     <div className="col-span-1">
                       <label className="block text-sm font-medium text-gray-700 mb-2">อธิบาย</label>
                       <input
                         type="text"
                         value={newShiftDescription}
                         onChange={(e) => setNewShiftDescription(e.target.value)}
                         placeholder="เช่น เวรเช้า"
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                     {newShiftType === 'special' && (
                       <>
                         <div className="col-span-1">
                           <label className="block text-sm font-medium text-gray-700 mb-2">สีตัวอักษร</label>
                           <input
                             type="color"
                             value={newShiftTextColor}
                             onChange={(e) => setNewShiftTextColor(e.target.value)}
                             className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                           />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-sm font-medium text-gray-700 mb-2">สีพื้นหลัง</label>
                           <input
                             type="color"
                             value={newShiftBackgroundColor}
                             onChange={(e) => setNewShiftBackgroundColor(e.target.value)}
                             className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                           />
                         </div>
                       </>
                     )}
                   </div>
                   <button
                     onClick={addShiftOption}
                     disabled={!newShiftName.trim()}
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     เพิ่มเวร
                   </button>
                 </div>

                 {/* ตารางแสดงตัวเลือกเวร */}
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-3">ตัวเลือกเวรที่มีอยู่ ({shiftOptions.length} รายการ)</h3>
                   {shiftOptions.length === 0 ? (
                     <div className="text-center text-gray-500 py-8">
                       ยังไม่มีตัวเลือกเวร
                     </div>
                   ) : (
                     <div className="overflow-x-auto">
                       <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               เวร
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ประเภท
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               อธิบาย
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               สี
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               นับในสรุป
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               การจัดการ
                             </th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200">
                           {shiftOptions.map((option) => (
                             <tr key={option.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {option.name}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                   option.type === 'normal' 
                                     ? 'bg-blue-100 text-blue-800' 
                                     : 'bg-green-100 text-green-800'
                                 }`}>
                                   {option.type === 'normal' ? 'เวรธรรมดา' : 'เวรพิเศษ'}
                                 </span>
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {option.description}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {option.type === 'special' ? (
                                   <div className="flex items-center gap-2">
                                     <div className="flex items-center gap-1">
                                       <span className="text-xs">ตัวอักษร:</span>
                                       <input
                                         type="color"
                                         value={option.textColor || '#000000'}
                                         onChange={(e) => updateShiftColor(option.id, 'textColor', e.target.value)}
                                         className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                                       />
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <span className="text-xs">พื้นหลัง:</span>
                                       <input
                                         type="color"
                                         value={option.backgroundColor || '#ffffff'}
                                         onChange={(e) => updateShiftColor(option.id, 'backgroundColor', e.target.value)}
                                         className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                                       />
                                     </div>
                                   </div>
                                 ) : (
                                   <span className="text-gray-500 text-xs">ไม่ต้องใส่สี</span>
                                 )}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 <input
                                   type="checkbox"
                                   checked={option.includeInTeam}
                                   onChange={() => toggleIncludeInTeam(option.id)}
                                   disabled={option.type === 'normal'}
                                   className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                                     option.type === 'normal' ? 'opacity-50 cursor-not-allowed' : ''
                                   }`}
                                 />
                                 {option.type === 'normal' && (
                                   <span className="text-xs text-gray-500 ml-2">บังคับ</span>
                                 )}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 <button
                                   onClick={() => removeShiftOption(option.id)}
                                   className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                 >
                                   ลบ
                                 </button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </div>

                 {/* ปุ่มบันทึก */}
                 <div className="flex justify-end">
                   <button
                     onClick={saveShiftOptions}
                     disabled={savingShifts || shiftOptions.length === 0 || shiftsSaved}
                     className={`px-6 py-2 rounded-md text-white font-medium ${
                       savingShifts || shiftOptions.length === 0 || shiftsSaved
                         ? 'bg-gray-400 cursor-not-allowed'
                         : 'bg-green-600 hover:bg-green-700'
                     }`}
                   >
                     {savingShifts ? 'กำลังบันทึก...' : shiftsSaved ? 'บันทึกแล้ว' : 'บันทึกตัวเลือกเวร'}
                   </button>
                 </div>
               </div>
             )}

             {/* เมนูจัดการสิทธิ์ */}
             {activeMenu === 'permissions' && (
               <div className="bg-white rounded-lg shadow-md p-6">
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-3">จัดการสิทธิ์เจ้าหน้าที่</h3>
                   <p className="text-gray-600 mb-4">กำหนดสิทธิ์การแก้ไขตารางเวรและการมอบหมายงานให้กับเจ้าหน้าที่ในทีม</p>
                   
                   {teamMembers.length === 0 ? (
                     <div className="text-center text-gray-500 py-8">
                       ยังไม่มีคนในทีม กรุณาเพิ่มคนในทีมก่อน
                     </div>
                   ) : (
                     <div className="overflow-x-auto">
                       <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ชื่อเจ้าหน้าที่
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ตำแหน่ง
                             </th>
                             <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               สิทธิ์การแก้ไขตารางเวร
                             </th>
                             <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               สิทธิ์การมอบหมายงาน
                             </th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200">
                           {teamMembers.map((member) => (
                             <tr key={member.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {member.firstName} {member.lastName}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {member.role}
                               </td>
                               <td className="px-4 py-3 text-center border-b">
                                 <input
                                   type="checkbox"
                                   checked={permissions[member.id]?.editSchedule || false}
                                   onChange={(e) => updatePermission(member.id, 'editSchedule', e.target.checked)}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                 />
                               </td>
                               <td className="px-4 py-3 text-center border-b">
                                 <input
                                   type="checkbox"
                                   checked={permissions[member.id]?.manageAssignments || false}
                                   onChange={(e) => updatePermission(member.id, 'manageAssignments', e.target.checked)}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                 />
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </div>

                 {/* ปุ่มบันทึก */}
                 <div className="flex justify-end">
                   <button
                     onClick={savePermissions}
                     disabled={savingPermissions || teamMembers.length === 0 || permissionsSaved}
                     className={`px-6 py-2 rounded-md text-white font-medium ${
                       savingPermissions || teamMembers.length === 0 || permissionsSaved
                         ? 'bg-gray-400 cursor-not-allowed'
                         : 'bg-green-600 hover:bg-green-700'
                     }`}
                   >
                     {savingPermissions ? 'กำลังบันทึก...' : permissionsSaved ? 'บันทึกแล้ว' : 'บันทึกสิทธิ์'}
                   </button>
                 </div>
               </div>
             )}

          </div>
        </div>
      </div>
    );
  };

export default Settings;
