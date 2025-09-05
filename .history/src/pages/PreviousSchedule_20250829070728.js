import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const PreviousSchedule = ({ userData }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // โหลดตารางเวรก่อนแลกทั้งหมด
  useEffect(() => {
    if (userData?.department) {
      fetchSchedules();
    }
  }, [userData?.department]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const schedulesRef = collection(db, 'schedulesBeforeExchange');
      const q = query(schedulesRef, where('department', '==', userData.department));
      const querySnapshot = await getDocs(q);
      
      const schedulesList = [];
      querySnapshot.forEach((doc) => {
        schedulesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // เรียงลำดับตามเดือน (ใหม่สุดก่อน)
      schedulesList.sort((a, b) => {
        const monthA = new Date(a.monthKey.split('-')[0], parseInt(a.monthKey.split('-')[1]) - 1);
        const monthB = new Date(b.monthKey.split('-')[0], parseInt(b.monthKey.split('-')[1]) - 1);
        return monthB - monthA;
      });
      
      // ไม่ต้องลบข้อมูลซ้ำ เพราะต้องการเก็บทั้งพยาบาลและผู้ช่วย
      setSchedules(schedulesList);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // แปลงเดือนเป็นภาษาไทย
  const getMonthName = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  // แสดงรูปภาพขนาดเต็ม
  const showFullImage = (imageData) => {
    setSelectedImage(imageData);
    setShowImageModal(true);
  };

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
        {/* หัวข้อ */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 text-center">ตารางเวรก่อนแลก</h1>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีตารางเวรก่อนแลก</h3>
            <p className="text-gray-500">ยังไม่มีการบันทึกตารางเวรก่อนแลกในระบบ</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* รายการเดือน */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                // สร้างรายการเดือนที่ไม่ซ้ำกัน
                const uniqueMonths = [...new Set(schedules.map(s => s.monthKey))];
                return uniqueMonths.map((monthKey) => {
                  // หาข้อมูลล่าสุดของเดือนนี้
                  const monthSchedules = schedules.filter(s => s.monthKey === monthKey);
                  const latestSchedule = monthSchedules.sort((a, b) => 
                    b.savedAt?.toDate?.() - a.savedAt?.toDate?.()
                  )[0];
                  
                  return (
                    <div
                      key={monthKey}
                      className={`bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedMonth === monthKey
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMonth(monthKey)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getMonthName(monthKey)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {latestSchedule?.savedAt?.toDate?.()?.toLocaleDateString('th-TH') || 'ไม่ระบุวันที่'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>บันทึกโดย: {latestSchedule?.savedBy || 'ไม่ระบุ'}</p>
                          <p>สถานะ: <span className="text-green-600 font-medium">อ่านอย่างเดียว</span></p>
                          <p className="text-xs text-gray-500">
                            มี {monthSchedules.length} ตาราง
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* แสดงรูปภาพเมื่อเลือกเดือน */}
            {selectedMonth && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 text-center">
                  รูปภาพตารางเวร - {getMonthName(selectedMonth)}
                </h2>
                
                                 {/* รูปภาพพยาบาล */}
                 <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                   <div className="bg-blue-100 text-blue-800 p-4 border-l-4 border-blue-400">
                     <h3 className="text-xl font-semibold text-center">ตารางพยาบาล</h3>
                   </div>
                   <div className="p-6 text-center">
                     {(() => {
                       // หาข้อมูลภาพรวมพยาบาล
                       const nurseOverview = schedules.find(s => 
                         s.monthKey === selectedMonth && 
                         s.type === 'overview' && 
                         s.overviewType === 'nurses'
                       );
                       
                                               if (nurseOverview && nurseOverview.tableHTML) {
                          return (
                            <div 
                              className="w-64 h-40 border-2 border-blue-300 rounded-lg mx-auto cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-white"
                              onClick={() => showFullImage({
                                title: `ตารางพยาบาล - ${getMonthName(selectedMonth)}`,
                                type: 'nurses',
                                month: selectedMonth,
                                tableHTML: nurseOverview.tableHTML
                              })}
                              dangerouslySetInnerHTML={{ __html: nurseOverview.tableHTML }}
                            />
                          );
                        } else {
                         return (
                           <div 
                             className="w-64 h-40 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg mx-auto cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-center"
                             onClick={() => showFullImage({
                               title: `ตารางพยาบาล - ${getMonthName(selectedMonth)}`,
                               type: 'nurses',
                               month: selectedMonth
                             })}
                           >
                             <div className="text-center">
                               <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                               <p className="text-blue-600 font-medium">คลิกเพื่อดูรูปขนาดเต็ม</p>
                               <p className="text-blue-500 text-sm">ตารางพยาบาล</p>
                             </div>
                           </div>
                         );
                       }
                     })()}
                   </div>
                 </div>

                                 {/* รูปภาพผู้ช่วย */}
                 <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-green-200/50 overflow-hidden">
                   <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-400">
                     <h3 className="text-xl font-semibold text-center">ตารางผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้</h3>
                   </div>
                   <div className="p-6 text-center">
                     {(() => {
                       // หาข้อมูลภาพรวมผู้ช่วย
                       const assistantOverview = schedules.find(s => 
                         s.monthKey === selectedMonth && 
                         s.type === 'overview' && 
                         s.overviewType === 'assistants'
                       );
                       
                                               if (assistantOverview && assistantOverview.tableHTML) {
                          return (
                            <div 
                              className="w-64 h-40 border-2 border-green-300 rounded-lg mx-auto cursor-pointer hover:border-green-400 transition-colors overflow-hidden bg-white"
                              onClick={() => showFullImage({
                                title: `ตารางผู้ช่วย - ${getMonthName(selectedMonth)}`,
                                type: 'assistants',
                                month: selectedMonth,
                                tableHTML: assistantOverview.tableHTML
                              })}
                              dangerouslySetInnerHTML={{ __html: assistantOverview.tableHTML }}
                            />
                          );
                        } else {
                         return (
                           <div 
                             className="w-64 h-40 bg-green-50 border-2 border-dashed border-green-300 rounded-lg mx-auto cursor-pointer hover:bg-green-100 transition-colors flex items-center justify-center"
                             onClick={() => showFullImage({
                               title: `ตารางผู้ช่วย - ${getMonthName(selectedMonth)}`,
                               type: 'assistants',
                               month: selectedMonth
                             })}
                           >
                             <div className="text-center">
                               <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                               <p className="text-green-600 font-medium">คลิกเพื่อดูรูปขนาดเต็ม</p>
                               <p className="text-green-500 text-sm">ตารางผู้ช่วย</p>
                             </div>
                           </div>
                         );
                       }
                     })()}
                   </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Modal แสดงรูปขนาดเต็ม */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{selectedImage.title}</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
                             <div className="text-center">
                 {selectedImage.tableHTML ? (
                   <div 
                     className="w-full max-h-96 overflow-auto border-2 border-gray-300 rounded-lg bg-white"
                     dangerouslySetInnerHTML={{ __html: selectedImage.tableHTML }}
                   />
                 ) : (
                  <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 text-lg font-medium">รูปภาพตารางเวร</p>
                      <p className="text-gray-500 text-sm">ประเภท: {selectedImage.type === 'nurses' ? 'พยาบาล' : 'ผู้ช่วย'}</p>
                      <p className="text-gray-500 text-sm">เดือน: {getMonthName(selectedImage.month)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousSchedule;
