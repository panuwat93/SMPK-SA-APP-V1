import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const OT4A = ({ userData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    department: userData?.department || '',
    month: '',
    totalAmount: '',
    dutyType: {
      overtime: false,
      outsideMainService: false,
      afternoonNightShift: false,
      afterHoursClinic: false,
      forensicExamination: false,
      other: false,
      otherSpecify: ''
    },
    staff: Array(8).fill().map(() => ({
      no: '',
      name: '',
      rate: '',
      days: Array(31).fill(''),
      totalDays: '',
      totalAmount: '',
      performerSignature: '',
      recipientSignature: ''
    }))
  });
  const [monthlyStaff, setMonthlyStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compensationRates, setCompensationRates] = useState({});
  const [shiftData, setShiftData] = useState({});

  // ดึงข้อมูลเจ้าหน้าที่รายเดือน
  useEffect(() => {
    if (userData?.department) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    const rates = await fetchCompensationRates();
    const shiftData = await fetchShiftData();
    await fetchMonthlyStaff(rates, shiftData);
  };

  const fetchCompensationRates = async () => {
    try {
      const compensationRef = doc(db, 'compensationRates', userData.department);
      const compensationDoc = await getDoc(compensationRef);
      
      if (compensationDoc.exists()) {
        const rates = compensationDoc.data().rates || {};
        setCompensationRates(rates);
        return rates;
      }
      return {};
    } catch (error) {
      console.error('Error fetching compensation rates:', error);
      return {};
    }
  };

  const fetchShiftData = async (selectedMonth = null) => {
    try {
      let monthKey;
      if (selectedMonth) {
        // ใช้เดือนที่เลือกจากฟอร์ม
        const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const monthIndex = monthNames.indexOf(selectedMonth);
        if (monthIndex !== -1) {
          // ใช้ปี 2025
          const year = 2025;
          monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        } else {
          // ถ้าไม่เจอเดือน ให้ใช้เดือนปัจจุบัน
          const currentDate = new Date();
          monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }
      } else {
        // ใช้เดือนปัจจุบัน แต่ปี 2025
        const currentDate = new Date();
        monthKey = `2025-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      console.log('Fetching shift data for monthKey:', monthKey);
      
      // ลองหาใน schedules collection ก่อน (ShiftSchedule)
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        console.log('Schedule data found:', data);
        
        // แปลงข้อมูลจาก format schedules เป็น format ที่ใช้ในฟอร์ม
        const convertedData = {};
        const cellStyles = data.cellStyles || {};
        
        if (data.schedule) {
          Object.keys(data.schedule).forEach(memberId => {
            Object.keys(data.schedule[memberId]).forEach(dayIndex => {
              const dayData = data.schedule[memberId][dayIndex];
              if (dayData.top) {
                const cellKey = `${memberId}-${dayIndex}-top`;
                const cellStyle = cellStyles[cellKey] || {};
                convertedData[`${memberId}-${dayIndex}-shift`] = {
                  value: dayData.top,
                  textColor: cellStyle.textColor || '#000000'
                };
              }
              if (dayData.bottom) {
                const cellKey = `${memberId}-${dayIndex}-bottom`;
                const cellStyle = cellStyles[cellKey] || {};
                convertedData[`${memberId}-${dayIndex}-oncall`] = {
                  value: dayData.bottom,
                  textColor: cellStyle.textColor || '#000000'
                };
              }
            });
          });
        }
        
        console.log('Converted data:', convertedData);
        setShiftData(convertedData);
        return convertedData;
      } else {
        console.log('No schedule data found for monthKey:', monthKey);
        
        // ลองหาใน oncallSchedules
        console.log('Trying oncallSchedules...');
        const oncallRef = doc(db, 'oncallSchedules', `${userData.department}-${monthKey}`);
        const oncallDoc = await getDoc(oncallRef);
        
        if (oncallDoc.exists()) {
          const data = oncallDoc.data();
          console.log('Oncall data found:', data);
          
          // แปลงข้อมูลจาก format oncallSchedules เป็น format ที่ใช้ในฟอร์ม
          const convertedData = {};
          const cellStyles = data.cellStyles || {};
          
          if (data.schedule) {
            Object.keys(data.schedule).forEach(memberId => {
              Object.keys(data.schedule[memberId]).forEach(dayIndex => {
                const dayData = data.schedule[memberId][dayIndex];
                if (dayData.top) {
                  const cellKey = `${memberId}-${dayIndex}-top`;
                  const cellStyle = cellStyles[cellKey] || {};
                  convertedData[`${memberId}-${dayIndex}-shift`] = {
                    value: dayData.top,
                    textColor: cellStyle.textColor || '#000000'
                  };
                }
                if (dayData.bottom) {
                  const cellKey = `${memberId}-${dayIndex}-bottom`;
                  const cellStyle = cellStyles[cellKey] || {};
                  convertedData[`${memberId}-${dayIndex}-oncall`] = {
                    value: dayData.bottom,
                    textColor: cellStyle.textColor || '#000000'
                  };
                }
              });
            });
          }
          
          console.log('Converted oncall data:', convertedData);
          setShiftData(convertedData);
          return convertedData;
        } else {
          console.log('No oncall data found either');
        }
      }
      return {};
    } catch (error) {
      console.error('Error fetching shift data:', error);
      return {};
    }
  };

  const fetchMonthlyStaff = async (rates = {}, shiftData = {}) => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลทีม
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        setLoading(false);
        return;
      }
      
      const teamMembers = teamDoc.data().members || [];
      
      // ดึงข้อมูลประเภทพนักงาน
      const staffTypesRef = doc(db, 'staffTypes', userData.department);
      const staffTypesDoc = await getDoc(staffTypesRef);
      
      const staffTypes = staffTypesDoc.exists() ? staffTypesDoc.data().types || {} : {};
      
      // กรองเฉพาะเจ้าหน้าที่รายเดือน
      const monthlyStaffList = teamMembers
        .filter(member => staffTypes[member.id] === 'monthly')
        .sort((a, b) => a.order - b.order);
      
      setMonthlyStaff(monthlyStaffList);
      
      // อัปเดตฟอร์มด้วยข้อมูลเจ้าหน้าที่รายเดือน
      const updatedStaff = Array(8).fill().map((_, index) => {
        if (index < monthlyStaffList.length) {
          const member = monthlyStaffList[index];
          // ดึงอัตราค่าจ้างตามตำแหน่ง
          const rate = rates[member.role]?.ot || '';
          
          // ดึงข้อมูลเวรสำหรับ 31 วัน (เฉพาะเวรสีแดง: ช/บ/ด/MB)
          const days = Array(31).fill('').map((_, dayIndex) => {
            // ดึงเวรจากแถวบน (shift) และแถวล่าง (oncall)
            const shiftKey = `${member.id}-${dayIndex}-shift`;
            const oncallKey = `${member.id}-${dayIndex}-oncall`;
            
            const shiftDataItem = shiftData[shiftKey];
            const oncallDataItem = shiftData[oncallKey];
            
            const shiftValue = shiftDataItem?.value || '';
            const oncallValue = oncallDataItem?.value || '';
            
            // Debug: แสดงข้อมูลเวรสำหรับวันแรก
            if (dayIndex === 0) {
              console.log(`Member ${member.firstName}: shiftKey=${shiftKey}, oncallKey=${oncallKey}`);
              console.log(`shiftValue=${shiftValue}, oncallValue=${oncallValue}`);
              console.log(`shiftColor=${shiftDataItem?.textColor}, oncallColor=${oncallDataItem?.textColor}`);
            }
            
            // ตรวจสอบสีของเวร - ต้องเป็นสีแดง (#ff0000) เท่านั้น
            const isShiftRed = shiftDataItem?.textColor === '#ff0000';
            const isOncallRed = oncallDataItem?.textColor === '#ff0000';
            
            let validShiftValue = '';
            let validOncallValue = '';
            
            // ตรวจสอบว่าเป็นเวรสีแดงและไม่ใช่ O
            if (isShiftRed && shiftValue !== 'O') {
              validShiftValue = shiftValue;
            }
            
            if (isOncallRed && oncallValue !== 'O') {
              validOncallValue = oncallValue;
            }
            
            // รวมเวรทั้งสองแถว (ถ้ามี)
            let combinedShift = '';
            if (validShiftValue && validOncallValue) {
              combinedShift = `${validShiftValue}/${validOncallValue}`;
            } else if (validShiftValue) {
              combinedShift = validShiftValue;
            } else if (validOncallValue) {
              combinedShift = validOncallValue;
            }
            
            return combinedShift;
          });
          
          return {
            no: (index + 1).toString(),
            name: `${member.firstName} ${member.lastName}`,
            rate: rate,
            days: days,
            totalDays: '',
            totalAmount: '',
            performerSignature: '',
            recipientSignature: ''
          };
        }
        return {
          no: '',
          name: '',
          rate: '',
          days: Array(31).fill(''),
          totalDays: '',
          totalAmount: '',
          performerSignature: '',
          recipientSignature: ''
        };
      });
      
      setFormData(prev => ({
        ...prev,
        staff: updatedStaff
      }));
      
    } catch (error) {
      console.error('Error fetching monthly staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (section, index, field, value) => {
    if (section === 'staff') {
      setFormData(prev => ({
        ...prev,
        staff: prev.staff.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }));
    } else if (section === 'dutyType') {
      setFormData(prev => ({
        ...prev,
        dutyType: {
          ...prev.dutyType,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // ถ้าเปลี่ยนเดือน ให้โหลดข้อมูลเวรใหม่
      if (field === 'month' && value) {
        const newShiftData = await fetchShiftData(value);
        await updateStaffWithShiftData(newShiftData);
      }
    }
  };

  const updateStaffWithShiftData = async (shiftData = {}) => {
    if (monthlyStaff.length === 0) return;
    
    const updatedStaff = formData.staff.map((staff, index) => {
      if (index < monthlyStaff.length) {
        const member = monthlyStaff[index];
        
        // ดึงข้อมูลเวรสำหรับ 31 วัน (เฉพาะเวรสีแดง: ช/บ/ด/MB)
        const days = Array(31).fill('').map((_, dayIndex) => {
          // ดึงเวรจากแถวบน (shift) และแถวล่าง (oncall)
          const shiftKey = `${member.id}-${dayIndex}-shift`;
          const oncallKey = `${member.id}-${dayIndex}-oncall`;
          
          const shiftValue = shiftData[shiftKey] || '';
          const oncallValue = shiftData[oncallKey] || '';
          
          // Debug: แสดงข้อมูลเวรสำหรับวันแรก
          if (dayIndex === 0) {
            console.log(`Update - Member ${member.firstName}: shiftKey=${shiftKey}, oncallKey=${oncallKey}`);
            console.log(`Update - shiftValue=${shiftValue}, oncallValue=${oncallValue}`);
          }
          
                      // กรองเฉพาะเวรสีแดง (ช/บ/ด/MB) เท่านั้น
            const redShifts = ['ช', 'บ', 'ด', 'MB'];
          
          let validShiftValue = '';
          let validOncallValue = '';
          
          if (redShifts.includes(shiftValue) && shiftValue !== 'O') {
            validShiftValue = shiftValue;
          }
          
          if (redShifts.includes(oncallValue) && oncallValue !== 'O') {
            validOncallValue = oncallValue;
          }
          
          // รวมเวรทั้งสองแถว (ถ้ามี)
          let combinedShift = '';
          if (validShiftValue && validOncallValue) {
            combinedShift = `${validShiftValue}/${validOncallValue}`;
          } else if (validShiftValue) {
            combinedShift = validShiftValue;
          } else if (validOncallValue) {
            combinedShift = validOncallValue;
          }
          
          return combinedShift;
        });
        
        return {
          ...staff,
          days: days
        };
      }
      return staff;
    });
    
    setFormData(prev => ({
      ...prev,
      staff: updatedStaff
    }));
  };

  const handlePrint = () => {
    // Add print styles
    const printStyles = `
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible !important;
        }
        .print-content {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        /* Hide browser UI elements */
        @page {
          margin: 0 !important;
        }
      }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
    
    window.print();
    
    // Remove the style after printing
    document.head.removeChild(styleSheet);
  };

  const handleDayChange = (staffIndex, dayIndex, value) => {
    setFormData(prev => ({
      ...prev,
      staff: prev.staff.map((item, i) => 
        i === staffIndex 
          ? { 
              ...item, 
              days: item.days.map((day, j) => 
                j === dayIndex ? value : day
              )
            } 
          : item
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลดข้อมูลเจ้าหน้าที่รายเดือน...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto print-content" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">แบบฟอร์ม OT-4A รายเดือน OT</h1>
          <p className="text-sm text-gray-600 mb-2">
            เจ้าหน้าที่รายเดือน: {monthlyStaff.length} คน
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-300 p-6">
          {/* Title */}
          <div className="mb-6 relative">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-4">หลักฐานการจ่ายเงินค่าตอบแทนการปฏิบัติงาน</h2>
              
              {/* Duty Type Checkboxes */}
              <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.overtime}
                    onChange={(e) => handleInputChange('dutyType', '', 'overtime', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) นอกเวลา</span>
                </label>
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.outsideMainService}
                    onChange={(e) => handleInputChange('dutyType', '', 'outsideMainService', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) นอกสถานบริการหลัก</span>
                </label>
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.afternoonNightShift}
                    onChange={(e) => handleInputChange('dutyType', '', 'afternoonNightShift', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) เวร บ่าย/ดึก</span>
                </label>
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.afterHoursClinic}
                    onChange={(e) => handleInputChange('dutyType', '', 'afterHoursClinic', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) คลินิกนอกเวลา</span>
                </label>
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.forensicExamination}
                    onChange={(e) => handleInputChange('dutyType', '', 'forensicExamination', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) ชันสูตรพลิกศพ</span>
                </label>
                <label className="flex items-center">
                  <span className="mr-2">(</span>
                  <input 
                    type="checkbox" 
                    checked={formData.dutyType.other}
                    onChange={(e) => handleInputChange('dutyType', '', 'other', e.target.checked)}
                    className="mr-2"
                  />
                  <span>) อื่นๆระบุ</span>
                  <input 
                    type="text" 
                    className="border-b border-gray-400 mx-1 w-20"
                    value={formData.dutyType.otherSpecify}
                    onChange={(e) => handleInputChange('dutyType', '', 'otherSpecify', e.target.value)}
                  />
                </label>
              </div>

              {/* Department and Month */}
              <div className="text-sm">
                <span className="mr-2">ชื่อหน่วยงาน</span>
                <span className="mx-2 font-medium">{formData.department}</span>
                <span className="mr-2">ประจำเดือน</span>
                <select 
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={formData.month}
                  onChange={(e) => handleInputChange('', '', 'month', e.target.value)}
                >
                  <option value="">เลือกเดือน</option>
                  <option value="มกราคม">มกราคม</option>
                  <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                  <option value="มีนาคม">มีนาคม</option>
                  <option value="เมษายน">เมษายน</option>
                  <option value="พฤษภาคม">พฤษภาคม</option>
                  <option value="มิถุนายน">มิถุนายน</option>
                  <option value="กรกฎาคม">กรกฎาคม</option>
                  <option value="สิงหาคม">สิงหาคม</option>
                  <option value="กันยายน">กันยายน</option>
                  <option value="ตุลาคม">ตุลาคม</option>
                  <option value="พฤศจิกายน">พฤศจิกายน</option>
                  <option value="ธันวาคม">ธันวาคม</option>
                </select>
              </div>
            </div>
            <div className="absolute top-0 right-0">
              <p className="text-sm font-bold">แบบฟอร์ม OT - 4A</p>
            </div>
          </div>

          {/* Main Table */}
          <div>
            <table className="w-full border border-gray-400" style={{ fontSize: '8px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลำดับ</th>
                  <th className="border border-gray-400 p-1" style={{ width: '3cm', fontSize: '8px' }}>ชื่อ-นามสกุล</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>อัตราค่าจ้าง/ค่าตอบแทน</th>
                  <th className="border border-gray-400 p-1 text-center" colSpan="31" style={{ fontSize: '8px' }}>วันที่ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>รวมวัน/ชม.ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>รวมเงิน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลายมือชื่อผู้ปฏิบัติงานจริง</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลายมือชื่อผู้รับเงิน</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  {/* Days 1-31 */}
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} className="border border-gray-400 p-1 w-6 text-center" style={{ fontSize: '8px' }}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                </tr>
              </thead>
                             <tbody>
                 {formData.staff.map((staff, staffIndex) => (
                   <tr key={staffIndex}>
                     <td className="border border-gray-400 p-1" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full text-center border-none outline-none"
                         value={staff.no}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'no', e.target.value)}
                       />
                     </td>
                     <td className="border border-gray-400 p-1" style={{ width: '3cm' }}>
                       <input 
                         type="text" 
                         className="w-full border-none outline-none"
                         value={staff.name}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'name', e.target.value)}
                       />
                     </td>
                     <td className="border border-gray-400 p-1" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full border-none outline-none"
                         value={staff.rate}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'rate', e.target.value)}
                       />
                     </td>
                     {/* Days 1-31 */}
                     {staff.days.map((day, dayIndex) => (
                       <td key={dayIndex} className="border border-gray-400 p-1 w-6">
                         <input 
                           type="text" 
                           className="w-full text-center border-none outline-none"
                           value={day}
                           onChange={(e) => handleDayChange(staffIndex, dayIndex, e.target.value)}
                         />
                       </td>
                     ))}
                     <td className="border border-gray-400 p-1" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full text-center border-none outline-none"
                         value={staff.totalDays}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'totalDays', e.target.value)}
                       />
                     </td>
                     <td className="border border-gray-400 p-1 relative" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full text-center border-none outline-none"
                         value={staff.totalAmount}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'totalAmount', e.target.value)}
                       />
                       {/* Extra cell for total amount - only show on last row */}
                       {staffIndex === 7 && (
                         <div className="absolute -bottom-6 left-0 right-0 border border-gray-400 p-1 bg-white">
                           <input 
                             type="text" 
                             className="w-full text-center border-none outline-none"
                             value={formData.totalAmount}
                             onChange={(e) => handleInputChange('', '', 'totalAmount', e.target.value)}
                           />
                         </div>
                       )}
                     </td>
                     <td className="border border-gray-400 p-1" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full border-none outline-none"
                         value={staff.performerSignature}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'performerSignature', e.target.value)}
                       />
                     </td>
                     <td className="border border-gray-400 p-1" style={{ width: '0.8cm' }}>
                       <input 
                         type="text" 
                         className="w-full border-none outline-none"
                         value={staff.recipientSignature}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'recipientSignature', e.target.value)}
                       />
                     </td>
                   </tr>
                 ))}
               </tbody>
                         </table>
           </div>

           {/* Total Amount Section */}
           <div className="mt-2 text-center">
             <p className="text-sm">
               <span className="border-b border-gray-400 inline-block w-96 h-5"></span>
               รวมทั้งสิ้น
             </p>
           </div>

           {/* Notes and Signature Section */}
          <div className="mt-6 grid grid-cols-2 gap-8">
            {/* Notes Section */}
            <div>
              <h3 className="font-bold text-sm mb-2">หมายเหตุ</h3>
              <div className="text-xs space-y-2">
                <p>1. กรณีปฏิบัติงานนอกเวลา หรือเป็นเวรผลัด (8 ชม.) ให้กาเครื่องหมาย /</p>
                <p>2. กรณีปฏิบัติงานนอกเวลาไม่ครบ 8 ชั่วโมง ให้ลงจำนวนชั่วโมงที่ปฏิบัติงานในแต่ละวัน</p>
                <p>3. กรณีออกไปชันสูตรพลิกศพนอกสถานที่ ต้องหักลบจำนวนชั่วโมงปฏิบัติงานในเวรผลัดด้วย</p>
                <p>4. เอกสารที่ต้องแนบไปเพื่อเบิกจ่าย (ทุกครั้ง)</p>
                <div className="ml-4 space-y-1">
                  <p>4.1 คำสั่งให้ปฏิบัติงาน</p>
                  <p>4.2 ตารางเวร</p>
                  <p>4.3 หลักฐานการจ่ายค่าตอบแทน</p>
                </div>
              </div>
            </div>

                         {/* Signature Section */}
             <div className="text-center">
               <p className="text-xs mb-4">ขอรับรองว่า ผู้มีรายชื่อข้างต้นปฏิบัติงานจริงตามที่เบิกจริง</p>
               
                               <div className="space-y-4">
                  <div>
                    <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                    <p className="text-xs">ลงชื่อ หัวหน้าผู้ควบคุม</p>
                    <p className="text-xs">(_____________________)</p>
                    <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                    <p className="text-xs">ตำแหน่ง</p>
                    <p className="text-xs">ตรวจสอบถูกต้อง</p>
                  </div>
                  
                  <div>
                    <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                    <p className="text-xs">ลงชื่อ ผู้ขออนุมัติ</p>
                    <p className="text-xs">(_____________________)</p>
                    <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                    <p className="text-xs">ตำแหน่ง</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4 no-print">
          <button 
            onClick={() => navigate('/payroll')}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            กลับ
          </button>
          <button className="px-6 py-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-lg font-medium transition-colors">
            บันทึก
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-lg font-medium transition-colors"
          >
            พิมพ์
          </button>
        </div>
      </div>
    </div>
  );
};

export default OT4A;
