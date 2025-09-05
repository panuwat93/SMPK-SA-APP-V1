import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShiftSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [scheduleData, setScheduleData] = useState({});

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
         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
       <div className="w-full">
         <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-100 text-center">
           <h1 className="text-3xl font-bold text-slate-800 mb-2">ตารางเวร</h1>
           <p className="text-slate-600 font-medium">แผนก: {userData?.department}</p>
         </div>

                 {/* ตารางพยาบาล */}
         {nurses.length > 0 && (
                       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-blue-200/50">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <div className="w-2 h-8 bg-blue-600 rounded-full mr-3"></div>
                พยาบาล
              </h2>
             <div className="overflow-x-auto w-full">
                               <table className="w-full border border-slate-300 rounded-lg overflow-hidden">
                 <thead className="bg-gradient-to-r from-slate-700 to-slate-800">
                   <tr>
                     <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-16">
                       No.
                     </th>
                     <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-48">
                       ชื่อ-นามสกุล
                     </th>
                     {dateColumns.map(date => (
                       <th key={date} className="border border-slate-600 px-2 py-3 text-xs font-semibold text-white uppercase tracking-wider w-20 text-center">
                         {date}
                       </th>
                     ))}
                     <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-20 text-center">
                       เวรรวม
                     </th>
                     <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-20 text-center">
                       OT
                     </th>
                     <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-24 text-center">
                       ค่าเวร
                     </th>
                   </tr>
                 </thead>
                                 <tbody className="bg-white">
                   {nurses.map((member, index) => (
                     <tr key={member.id} className="hover:bg-gray-50 border-b-2 border-slate-300">
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                                           <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                       <div className="flex flex-col items-center">
                         <span className="font-medium">{member.firstName}</span>
                         <span className="text-xs text-slate-600">{member.lastName}</span>
                       </div>
                     </td>
                                             {dateColumns.map(date => (
                          <td key={date} className="border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center cursor-pointer hover:bg-blue-50">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-500">-</span>
                              <span className="text-xs text-slate-400">-</span>
                            </div>
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
           <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-blue-200/50">
             <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
               <div className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></div>
               ผู้ช่วยพยาบาล / พนักงานผู้ช่วยเหลือคนไข้
             </h2>
             <div className="overflow-x-auto w-full">
               <table className="w-full border border-slate-300 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-slate-700 to-slate-800">
                  <tr>
                    <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-16">
                      No.
                    </th>
                    <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-48">
                      ชื่อ-นามสกุล
                    </th>
                    
                    {dateColumns.map(date => (
                      <th key={date} className="border border-slate-600 px-2 py-3 text-xs font-semibold text-white uppercase tracking-wider w-20 text-center">
                        {date}
                      </th>
                    ))}
                    <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider w-20 text-center">
                      เวรรวม
                    </th>
                    <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 text-center">
                      OT
                    </th>
                    <th className="border border-slate-600 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 text-center">
                      ค่าเวร
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {otherStaff.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50 border-b-2 border-slate-300">
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                                             <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 text-center">
                         <div className="flex flex-col items-center">
                           <span className="font-medium">{member.firstName}</span>
                           <span className="text-xs text-slate-600">{member.lastName}</span>
                         </div>
                       </td>
                       
                       {dateColumns.map(date => (
                         <td key={date} className="border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center cursor-pointer hover:bg-blue-50">
                           <div className="flex flex-col items-center">
                             <span className="text-xs text-slate-500">-</span>
                             <span className="text-xs text-slate-400">-</span>
                           </div>
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
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">ยังไม่มีสมาชิกในทีม</p>
              <p className="text-slate-500 text-sm mt-1">กรุณาตั้งค่าทีมในหน้า "ตั้งค่า" ก่อน</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default ShiftSchedule;
