import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShiftSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
    }
  }, [userData]);

  const fetchTeamMembers = async () => {
    try {
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        setTeamMembers(teamData.members || []);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  // แยกเจ้าหน้าที่ตามตำแหน่ง
  const nurses = teamMembers.filter(member => member.role === 'พยาบาล');
  const otherStaff = teamMembers.filter(member => 
    member.role === 'ผู้ช่วยพยาบาล' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้'
  );

  // สร้างคอลัมน์วันที่ 1-31
  const dateColumns = Array.from({ length: 31 }, (_, i) => i + 1);

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ตารางเวร</h1>
          <p className="text-gray-600 mt-2">แผนก: {userData?.department}</p>
        </div>

                 {/* ตารางพยาบาล */}
         {nurses.length > 0 && (
           <div className="bg-white rounded-lg shadow-md p-4 mb-8">
             <h2 className="text-xl font-semibold text-gray-800 mb-4">พยาบาล</h2>
             <div className="overflow-x-auto w-full">
               <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      No.
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      ชื่อ-นามสกุล
                    </th>
                    {dateColumns.map(date => (
                      <th key={date} className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16 text-center">
                        {date}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20 text-center">
                      เวรรวม
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20 text-center">
                      OT
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-center">
                      ค่าเวร
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nurses.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        <div className="flex flex-col items-center">
                          <span>{member.firstName}</span>
                          <span>{member.lastName}</span>
                        </div>
                      </td>
                      {dateColumns.map(date => (
                        <td key={date} className="border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center cursor-pointer hover:bg-blue-50">
                          -
                        </td>
                      ))}
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                 {/* ตารางผู้ช่วยพยาบาลและพนักงานผู้ช่วยเหลือคนไข้ */}
         {otherStaff.length > 0 && (
           <div className="bg-white rounded-lg shadow-md p-4">
             <h2 className="text-xl font-semibold text-gray-800 mb-4">ผู้ช่วยพยาบาล / พนักงานผู้ช่วยเหลือคนไข้</h2>
             <div className="overflow-x-auto w-full">
               <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      No.
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      ตำแหน่ง
                    </th>
                    {dateColumns.map(date => (
                      <th key={date} className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16 text-center">
                        {date}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20 text-center">
                      เวรรวม
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20 text-center">
                      OT
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-center">
                      ค่าเวร
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {otherStaff.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        <div className="flex flex-col items-center">
                          <span>{member.firstName}</span>
                          <span>{member.lastName}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        {member.role}
                      </td>
                      {dateColumns.map(date => (
                        <td key={date} className="border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center cursor-pointer hover:bg-blue-50">
                          -
                        </td>
                      ))}
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                        0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                 {teamMembers.length === 0 && (
           <div className="bg-white rounded-lg shadow-md p-4 text-center">
             <p className="text-gray-500">ยังไม่มีสมาชิกในทีม กรุณาตั้งค่าทีมในหน้า "ตั้งค่า" ก่อน</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default ShiftSchedule;
