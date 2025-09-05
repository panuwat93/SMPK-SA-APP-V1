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
      time: '08:00-16:00',
      description: 'เวรเช้า',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 2,
      name: 'บ',
      time: '16:00-00:00',
      description: 'เวรบ่าย',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 3,
      name: 'ด',
      time: '00:00-08:00',
      description: 'เวรดึก',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 4,
      name: 'ก',
      time: '08:00-20:00',
      description: 'เวรกลางวัน',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    {
      id: 5,
      name: 'น',
      time: '20:00-08:00',
      description: 'เวรกลางคืน',
      includeInTeam: true,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    }
  ]);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftTime, setNewShiftTime] = useState('');
  const [newShiftDescription, setNewShiftDescription] = useState('');
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
        setBedOptions(options);
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
        setDutyOptions(options);
        setDutiesSaved(options.length > 0);
      }
    } catch (error) {
      console.error('Error fetching duty options:', error);
    }
  };

  const fetchExtraDutyOptions = async () => {
    try {
      const extraDutyOptionsRef = doc(db, 'extraDutyOptions', userData.department);
      const extraDutyOptionsDoc = await getDoc(extraDutyOptionsRef);
      
      if (extraDutyOptionsDoc.exists()) {
        const options = extraDutyOptionsDoc.data().options || [];
        setExtraDutyOptions(options);
        setExtraDutiesSaved(options.length > 0);
      }
    } catch (error) {
      console.error('Error fetching extra duty options:', error);
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
    if (newBedOption.trim() && !bedOptions.includes(newBedOption.trim())) {
      setBedOptions([...bedOptions, newBedOption.trim()]);
      setNewBedOption('');
      setBedsSaved(false);
    }
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
        options: bedOptions,
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
  const updateCompensationRate = (role, field, value) => {
    const newRates = { ...compensationRates };
    if (!newRates[role]) {
      newRates[role] = { ot: 0, night: 0 };
    }
    newRates[role][field] = parseFloat(value) || 0;
    setCompensationRates(newRates);
    setCompensationSaved(false);
  };

  const saveCompensationRates = async () => {
    setSavingCompensation(true);
    try {
      const compensationRef = doc(db, 'compensationRates', userData.department);
      await setDoc(compensationRef, {
        department: userData.department,
        rates: compensationRates,
        updatedAt: new Date()
      });
      setCompensationSaved(true);
      alert('บันทึกอัตราค่าตอบแทนเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving compensation rates:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingCompensation(false);
  };

  // ฟังก์ชันสำหรับจัดการตัวเลือกเวร
  const addShiftOption = () => {
    if (newShiftName.trim() && newShiftTime.trim()) {
      const newShift = {
        id: Date.now(),
        name: newShiftName.trim(),
        time: newShiftTime.trim(),
        description: newShiftDescription.trim(),
        includeInTeam: false,
        textColor: newShiftTextColor,
        backgroundColor: newShiftBackgroundColor
      };
      setShiftOptions([...shiftOptions, newShift]);
      setNewShiftName('');
      setNewShiftTime('');
      setNewShiftDescription('');
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
    const updatedOptions = shiftOptions.map(option => 
      option.id === id ? { ...option, includeInTeam: !option.includeInTeam } : option
    );
    setShiftOptions(updatedOptions);
    setShiftsSaved(false);
  };

  const updateShiftColor = (id, field, value) => {
    const updatedOptions = shiftOptions.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    );
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

  // ฟังก์ชันสำหรับจัดการประเภทเจ้าหน้าที่
  const updateStaffType = (userId, staffType) => {
    const newStaffTypes = { ...staffTypes };
    newStaffTypes[userId] = staffType;
    setStaffTypes(newStaffTypes);
    setStaffTypesSaved(false);
  };

  const saveStaffTypes = async () => {
    setSavingStaffTypes(true);
    try {
      const staffTypesRef = doc(db, 'staffTypes', userData.department);
      await setDoc(staffTypesRef, {
        department: userData.department,
        types: staffTypes,
        updatedAt: new Date()
      });
      setStaffTypesSaved(true);
      alert('บันทึกประเภทเจ้าหน้าที่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving staff types:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingStaffTypes(false);
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
              <button
                onClick={() => setActiveMenu('staffManagement')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === 'staffManagement'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                จัดการเจ้าหน้าที่
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
                            <div>
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
              </div>

              {/* แสดงตัวเลือกเตียงที่มีอยู่ */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">ตัวเลือกเตียงที่มีอยู่ ({bedOptions.length} รายการ)</h3>
                {bedOptions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    ยังไม่มีตัวเลือกเตียง
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bedOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-gray-800">{option}</span>
                        <button
                          onClick={() => removeBedOption(index)}
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
                  <h3 className="text-lg font-medium text-gray-800 mb-3">ตั้งค่าอัตราค่าตอบแทนตามตำแหน่ง</h3>
                  <p className="text-gray-600 mb-4">กำหนดอัตราค่าตอบแทนสำหรับแต่ละตำแหน่งในแผนก</p>
                  
                  <div className="space-y-4">
                    {['พยาบาล', 'ผู้ช่วยพยาบาล', 'พนักงานผู้ช่วยเหลือคนไข้'].map((role) => (
                      <div key={role} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-800 mb-3">{role}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              เวร OT (บาท/เวร)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={compensationRates[role]?.ot || 0}
                              onChange={(e) => updateCompensationRate(role, 'ot', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ค่าเวรบ่ายดึก (บาท/เวร)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={compensationRates[role]?.night || 0}
                              onChange={(e) => updateCompensationRate(role, 'night', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ปุ่มบันทึก */}
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
               </div>
             )}

             {/* เมนูตัวเลือกเวร */}
             {activeMenu === 'shiftOptions' && (
               <div className="bg-white rounded-lg shadow-md p-6">

                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-3">เพิ่มตัวเลือกเวรใหม่</h3>
                   <p className="text-gray-600 mb-4">เวรที่เปิด "นับในสรุป" จะถูกนับรวมในแถวสรุปของตารางเวร</p>
                   <div className="grid grid-cols-6 gap-4 mb-4">
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
                     <div className="col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-2">เวลา</label>
                       <div className="flex items-center gap-1">
                         <select
                           value={newShiftTime.split('-')[0] || ''}
                           onChange={(e) => {
                             const endTime = newShiftTime.split('-')[1] || '';
                             setNewShiftTime(`${e.target.value}-${endTime}`);
                           }}
                           className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="">เลือกเวลา</option>
                           <option value="00:00">00:00</option>
                           <option value="01:00">01:00</option>
                           <option value="02:00">02:00</option>
                           <option value="03:00">03:00</option>
                           <option value="04:00">04:00</option>
                           <option value="05:00">05:00</option>
                           <option value="06:00">06:00</option>
                           <option value="07:00">07:00</option>
                           <option value="08:00">08:00</option>
                           <option value="09:00">09:00</option>
                           <option value="10:00">10:00</option>
                           <option value="11:00">11:00</option>
                           <option value="12:00">12:00</option>
                           <option value="13:00">13:00</option>
                           <option value="14:00">14:00</option>
                           <option value="15:00">15:00</option>
                           <option value="16:00">16:00</option>
                           <option value="17:00">17:00</option>
                           <option value="18:00">18:00</option>
                           <option value="19:00">19:00</option>
                           <option value="20:00">20:00</option>
                           <option value="21:00">21:00</option>
                           <option value="22:00">22:00</option>
                           <option value="23:00">23:00</option>
                         </select>
                         <span className="text-gray-500 text-sm">ถึง</span>
                         <select
                           value={newShiftTime.split('-')[1] || ''}
                           onChange={(e) => {
                             const startTime = newShiftTime.split('-')[0] || '';
                             setNewShiftTime(`${startTime}-${e.target.value}`);
                           }}
                           className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="">เลือกเวลา</option>
                           <option value="00:00">00:00</option>
                           <option value="01:00">01:00</option>
                           <option value="02:00">02:00</option>
                           <option value="03:00">03:00</option>
                           <option value="04:00">04:00</option>
                           <option value="05:00">05:00</option>
                           <option value="06:00">06:00</option>
                           <option value="07:00">07:00</option>
                           <option value="08:00">08:00</option>
                           <option value="09:00">09:00</option>
                           <option value="10:00">10:00</option>
                           <option value="11:00">11:00</option>
                           <option value="12:00">12:00</option>
                           <option value="13:00">13:00</option>
                           <option value="14:00">14:00</option>
                           <option value="15:00">15:00</option>
                           <option value="16:00">16:00</option>
                           <option value="17:00">17:00</option>
                           <option value="18:00">18:00</option>
                           <option value="19:00">19:00</option>
                           <option value="20:00">20:00</option>
                           <option value="21:00">21:00</option>
                           <option value="22:00">22:00</option>
                           <option value="23:00">23:00</option>
                         </select>
                       </div>
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
                   </div>
                   <button
                     onClick={addShiftOption}
                     disabled={!newShiftName.trim() || !newShiftTime.trim()}
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
                               เวลา
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
                                 {option.time}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {option.description}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
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
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 <input
                                   type="checkbox"
                                   checked={option.includeInTeam}
                                   onChange={() => toggleIncludeInTeam(option.id)}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                 />
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

             {/* เมนูจัดการเจ้าหน้าที่ */}
             {activeMenu === 'staffManagement' && (
               <div className="bg-white rounded-lg shadow-md p-6">
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-3">จัดการเจ้าหน้าที่</h3>
                   <p className="text-gray-600 mb-4">กำหนดประเภทเจ้าหน้าที่ในทีม (พนักงานรายเดือน/รายวัน)</p>
                   
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
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ลำดับ
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ชื่อเจ้าหน้าที่
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ตำแหน่ง
                             </th>
                             <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                               ประเภทพนักงาน
                             </th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200">
                           {teamMembers.map((member, index) => (
                             <tr key={member.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {index + 1}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {member.firstName} {member.lastName}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                 {member.role}
                               </td>
                               <td className="px-4 py-3 text-center border-b">
                                 <div className="flex justify-center space-x-4">
                                   <label className="flex items-center">
                                     <input
                                       type="radio"
                                       name={`staffType_${member.id}`}
                                       value="monthly"
                                       checked={staffTypes[member.id] === 'monthly'}
                                       onChange={(e) => updateStaffType(member.id, e.target.value)}
                                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                     />
                                     <span className="ml-2 text-sm text-gray-700">รายเดือน</span>
                                   </label>
                                   <label className="flex items-center">
                                     <input
                                       type="radio"
                                       name={`staffType_${member.id}`}
                                       value="daily"
                                       checked={staffTypes[member.id] === 'daily'}
                                       onChange={(e) => updateStaffType(member.id, e.target.value)}
                                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                     />
                                     <span className="ml-2 text-sm text-gray-700">รายวัน</span>
                                   </label>
                                 </div>
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
                       onClick={saveStaffTypes}
                       disabled={savingStaffTypes || staffTypesSaved}
                       className={`px-6 py-2 rounded-md text-white font-medium ${
                         savingStaffTypes || staffTypesSaved
                           ? 'bg-gray-400 cursor-not-allowed'
                           : 'bg-green-600 hover:bg-green-700'
                       }`}
                     >
                       {savingStaffTypes ? 'กำลังบันทึก...' : staffTypesSaved ? 'บันทึกแล้ว' : 'บันทึกประเภทเจ้าหน้าที่'}
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

export default Settings;
