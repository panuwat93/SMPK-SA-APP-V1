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
  
  // สำหรับจัดการเตียง
  const [bedOptions, setBedOptions] = useState([]);
  const [newBedOption, setNewBedOption] = useState('');
  const [savingBeds, setSavingBeds] = useState(false);
  const [bedsSaved, setBedsSaved] = useState(false);

  useEffect(() => {
    if (userData?.department) {
      fetchUsers();
      fetchTeamMembers();
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
      })).filter(user => user.role !== 'หัวหน้าหน่วยงาน'); // ไม่รวมหัวหน้าหน่วยงาน

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
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

  const addToTeam = (user) => {
    if (!teamMembers.find(member => member.id === user.id)) {
      const newMember = {
        ...user,
        order: teamMembers.length + 1
      };
      setTeamMembers([...teamMembers, newMember]);
      setSaved(false);
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
                จัดการหน้าที่เสริม
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">จัดการเตียง</h2>
              <p className="text-gray-600">การตั้งค่าสำหรับจัดการเตียงผู้ป่วย</p>
            </div>
          )}

          {/* เมนูจัดการหน้าที่ */}
          {activeMenu === 'duties' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">จัดการหน้าที่</h2>
              <p className="text-gray-600">การตั้งค่าสำหรับจัดการหน้าที่หลัก</p>
            </div>
          )}

          {/* เมนูจัดการหน้าที่เสริม */}
          {activeMenu === 'extraDuties' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">จัดการหน้าที่เสริม</h2>
              <p className="text-gray-600">การตั้งค่าสำหรับจัดการหน้าที่เสริม</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
