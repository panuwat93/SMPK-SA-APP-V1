import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const OT4A2 = ({ userData }) => {
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
  const [nurses, setNurses] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compensationRates, setCompensationRates] = useState({});
  const [shiftData, setShiftData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [staffPerPage] = useState(8);
  const [currentStaffType, setCurrentStaffType] = useState('nurses'); // 'nurses' or 'assistants'

  // ดึงข้อมูลเจ้าหน้าที่รายเดือน
  useEffect(() => {
    if (userData?.department) {
      loadData();
    }
  }, [userData]);

  // โหลดข้อมูลใหม่เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if ((nurses.length > 0 || assistants.length > 0) && compensationRates && shiftData) {
      fetchMonthlyStaff(compensationRates, shiftData);
    }
  }, [currentPage, currentStaffType]);

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
        const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const monthIndex = monthNames.indexOf(selectedMonth);
        if (monthIndex !== -1) {
          const year = 2025;
          monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        } else {
          const currentDate = new Date();
          monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }
      } else {
        const currentDate = new Date();
        monthKey = `2025-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      console.log('Fetching shift data for monthKey:', monthKey);
      
      // Try 'schedules' collection first (ShiftSchedule)
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        console.log('Schedule data found:', data);
        
        // Convert data from schedules format to flat key-value pairs
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
        
        // Try 'oncallSchedules' if not found in 'schedules'
        console.log('Trying oncallSchedules...');
        const oncallRef = doc(db, 'oncallSchedules', `${userData.department}-${monthKey}`);
        const oncallDoc = await getDoc(oncallRef);
        
        if (oncallDoc.exists()) {
          const data = oncallDoc.data();
          console.log('Oncall data found:', data);
          
          // Convert data from oncallSchedules format to flat key-value pairs
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

  // ฟังก์ชันแปลงตัวเลขเป็นคำอ่านภาษาไทย
  const numberToThaiText = (num) => {
    if (num === 0) return 'ศูนย์บาทถ้วน';
    
    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const tens = ['', '', 'ยี่', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    
    let result = '';
    let numStr = num.toString();
    let len = numStr.length;
    
    for (let i = 0; i < len; i++) {
      let digit = parseInt(numStr[i]);
      let place = len - i - 1;
      
      if (digit === 0) continue;
      
      if (place === 1 && digit === 1) {
        result += 'สิบ';
      } else if (place === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (place === 1) {
        result += tens[digit] + 'สิบ';
      } else if (place === 0 && digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else {
        result += units[digit];
        if (place > 1) {
          result += places[place];
        }
      }
    }
    
    return result + 'บาทถ้วน';
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
      
      // แยกพยาบาลและผู้ช่วย (ลองหลายรูปแบบการกรอง)
      const nursesList = monthlyStaffList.filter(member => {
        const position = member.position || '';
        const firstName = member.firstName || '';
        const lastName = member.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        
        return position.toLowerCase().includes('พยาบาล') ||
               position.toLowerCase().includes('nurse') ||
               fullName.includes('พยาบาล') ||
               firstName.toLowerCase().includes('พยาบาล') ||
               lastName.toLowerCase().includes('พยาบาล');
      });
      
      const assistantsList = monthlyStaffList.filter(member => {
        const position = member.position || '';
        const firstName = member.firstName || '';
        const lastName = member.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        
        return position.toLowerCase().includes('ผู้ช่วย') ||
               position.toLowerCase().includes('assistant') ||
               position.toLowerCase().includes('ช่วย') ||
               fullName.includes('ผู้ช่วย') ||
               firstName.toLowerCase().includes('ผู้ช่วย') ||
               lastName.toLowerCase().includes('ผู้ช่วย');
      });
      
      // Debug: แสดงข้อมูลเพื่อดูโครงสร้างจริง
      console.log('Monthly Staff List:', monthlyStaffList);
      console.log('Nurses found:', nursesList);
      console.log('Assistants found:', assistantsList);
      
      // ถ้าไม่เจอพยาบาลหรือผู้ช่วย ให้แบ่งครึ่งครึ่ง
      if (nursesList.length === 0 && assistantsList.length === 0) {
        console.log('No nurses/assistants found, splitting staff in half');
        const halfIndex = Math.ceil(monthlyStaffList.length / 2);
        setNurses(monthlyStaffList.slice(0, halfIndex));
        setAssistants(monthlyStaffList.slice(halfIndex));
      } else {
        setNurses(nursesList);
        setAssistants(assistantsList);
      }
      
      setMonthlyStaff(monthlyStaffList);
      
      // อัปเดตฟอร์มด้วยข้อมูลเจ้าหน้าที่รายเดือน
      const currentStaffList = currentStaffType === 'nurses' ? nursesList : assistantsList;
      const updatedStaff = Array(8).fill().map((_, index) => {
        const globalIndex = (currentPage - 1) * staffPerPage + index;
        if (globalIndex < currentStaffList.length) {
          const member = currentStaffList[globalIndex];
          // ดึงอัตราค่าจ้างตามตำแหน่ง (ใช้ค่าเวรบ่ายดึก)
          const rate = rates[member.id]?.shiftAllowance || '';
          
          // ดึงข้อมูลเวรสำหรับ 31 วัน (เฉพาะเวร บ/ด สีดำ)
          const days = Array(31).fill('').map((_, dayIndex) => {
            // ดึงเวรจากแถวบน (shift) และแถวล่าง (oncall)
            const shiftKey = `${member.id}-${dayIndex}-shift`;
            const oncallKey = `${member.id}-${dayIndex}-oncall`;
            
            const shiftDataItem = shiftData[shiftKey];
            const oncallDataItem = shiftData[oncallKey];
            
            const shiftValue = shiftDataItem?.value || '';
            const oncallValue = oncallDataItem?.value || '';
            
            // ตรวจสอบสีของเวร - ต้องเป็นสีดำ (#000000) เท่านั้น
            const isShiftBlack = shiftDataItem?.textColor === '#000000';
            const isOncallBlack = oncallDataItem?.textColor === '#000000';
            
            let validShiftValue = '';
            let validOncallValue = '';
            
            // ตรวจสอบว่าเป็นเวร บ/ด สีดำและไม่ใช่ O
            if (isShiftBlack && (shiftValue === 'บ' || shiftValue === 'ด') && shiftValue !== 'O') {
              validShiftValue = shiftValue;
            }
            
            if (isOncallBlack && (oncallValue === 'บ' || oncallValue === 'ด') && oncallValue !== 'O') {
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
          
          // คำนวณจำนวนเวร OT (นับเวรที่ไม่ว่าง)
          const totalOTDays = days.filter(day => day.trim() !== '').length;
          
          // คำนวณจำนวนเงิน (จำนวน OT × อัตราตอบแทน)
          const totalAmount = totalOTDays * (parseFloat(rate) || 0);
          
          return {
            no: (globalIndex + 1).toString(),
            name: `${member.firstName} ${member.lastName}`,
            rate: rate,
            days: days,
            totalDays: totalOTDays.toString(),
            totalAmount: totalAmount.toString(),
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
          i === index ? { 
            ...item, 
            [field]: value,
            // ถ้าแก้ไขอัตราตอบแทน ให้คำนวณจำนวนเงินใหม่
            ...(field === 'rate' ? {
              totalAmount: (item.days.filter(day => day.trim() !== '').length * (parseFloat(value) || 0)).toString()
            } : {})
          } : item
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
    const currentStaffList = currentStaffType === 'nurses' ? nurses : assistants;
    if (currentStaffList.length === 0) return;
    
    const updatedStaff = formData.staff.map((staff, index) => {
      const globalIndex = (currentPage - 1) * staffPerPage + index;
      if (globalIndex < currentStaffList.length) {
        const member = currentStaffList[globalIndex];
        
        // ดึงข้อมูลเวรสำหรับ 31 วัน (เฉพาะเวร บ/ด สีดำ)
        const days = Array(31).fill('').map((_, dayIndex) => {
          // ดึงเวรจากแถวบน (shift) และแถวล่าง (oncall)
          const shiftKey = `${member.id}-${dayIndex}-shift`;
          const oncallKey = `${member.id}-${dayIndex}-oncall`;
          
          const shiftDataItem = shiftData[shiftKey];
          const oncallDataItem = shiftData[oncallKey];
          
          const shiftValue = shiftDataItem?.value || '';
          const oncallValue = oncallDataItem?.value || '';
          
          // ตรวจสอบสีของเวร - ต้องเป็นสีดำ (#000000) เท่านั้น
          const isShiftBlack = shiftDataItem?.textColor === '#000000';
          const isOncallBlack = oncallDataItem?.textColor === '#000000';
          
          let validShiftValue = '';
          let validOncallValue = '';
          
          // ตรวจสอบว่าเป็นเวร บ/ด สีดำและไม่ใช่ O
          if (isShiftBlack && (shiftValue === 'บ' || shiftValue === 'ด') && shiftValue !== 'O') {
            validShiftValue = shiftValue;
          }
          
          if (isOncallBlack && (oncallValue === 'บ' || oncallValue === 'ด') && oncallValue !== 'O') {
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
        
        // คำนวณจำนวนเวร OT (นับเวรที่ไม่ว่าง)
        const totalOTDays = days.filter(day => day.trim() !== '').length;
        
        // คำนวณจำนวนเงิน (จำนวน OT × อัตราตอบแทน)
        const totalAmount = totalOTDays * (parseFloat(staff.rate) || 0);
        
        return {
          ...staff,
          days: days,
          totalDays: totalOTDays.toString(),
          totalAmount: totalAmount.toString()
        };
      }
      return staff;
    });
    
    setFormData(prev => ({
      ...prev,
      staff: updatedStaff
    }));
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
              ),
              // คำนวณจำนวนเวร OT ใหม่
              totalDays: item.days.map((day, j) => 
                j === dayIndex ? value : day
              ).filter(day => day.trim() !== '').length.toString(),
              // คำนวณจำนวนเงินใหม่ (จำนวน OT × อัตราตอบแทน)
              totalAmount: (item.days.map((day, j) => 
                j === dayIndex ? value : day
              ).filter(day => day.trim() !== '').length * (parseFloat(item.rate) || 0)).toString()
            } 
          : item
      )
    }));
  };

  // ฟังก์ชันสำหรับการเปลี่ยนหน้า
  const handlePageChange = async (newPage) => {
    setCurrentPage(newPage);
    // โหลดข้อมูลใหม่สำหรับหน้าปัจจุบัน
    await fetchMonthlyStaff(compensationRates, shiftData);
  };

  // ฟังก์ชันสำหรับเปลี่ยนประเภทเจ้าหน้าที่
  const handleStaffTypeChange = async (staffType) => {
    setCurrentStaffType(staffType);
    setCurrentPage(1); // รีเซ็ตเป็นหน้าแรก
    // โหลดข้อมูลใหม่สำหรับประเภทเจ้าหน้าที่ที่เลือก
    await fetchMonthlyStaff(compensationRates, shiftData);
  };

  // คำนวณจำนวนหน้าทั้งหมด
  const currentStaffList = currentStaffType === 'nurses' ? nurses : assistants;
  const totalPages = Math.ceil(currentStaffList.length / staffPerPage);

  // คำนวณจำนวนเจ้าหน้าที่ในหน้าปัจจุบัน
  const startIndex = (currentPage - 1) * staffPerPage;
  const endIndex = Math.min(startIndex + staffPerPage, currentStaffList.length);

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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{fontFamily: 'Kanit, sans-serif'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto print-content" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            แบบฟอร์ม OT-4A รายเดือน ค่าเวร
            {monthlyStaff.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (เจ้าหน้าที่รายเดือน {monthlyStaff.length} คน)
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mb-2">
            เจ้าหน้าที่รายเดือน: {monthlyStaff.length} คน (พยาบาล: {nurses.length} คน, ผู้ช่วย: {assistants.length} คน)
          </p>
          
          {/* ปุ่มเลือกประเภทเจ้าหน้าที่ */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => handleStaffTypeChange('nurses')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStaffType === 'nurses'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              พยาบาล ({nurses.length} คน)
            </button>
            <button
              onClick={() => handleStaffTypeChange('assistants')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStaffType === 'assistants'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              ผู้ช่วย ({assistants.length} คน)
            </button>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mb-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-sm text-gray-600">
                หน้า {currentPage} จาก {totalPages} ({startIndex + 1}-{endIndex} จาก {currentStaffList.length} คน)
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
              >
                ถัดไป →
              </button>
            </div>
          )}
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
                  <th className="border border-gray-400 p-1" style={{ width: '2.7cm', fontSize: '8px' }}>ชื่อ-นามสกุล</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>อัตราค่าจ้าง/ค่าตอบแทน</th>
                  <th className="border border-gray-400 p-1 text-center" colSpan="31" style={{ fontSize: '8px' }}>วันที่ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>รวมวัน/ชม.ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '1.2cm', fontSize: '6px' }}>รวมเงิน</th>
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
                     <td className="border border-gray-400 p-1" style={{ width: '2.7cm' }}>
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
                     <td className="border border-gray-400 p-1 relative" style={{ width: '1.2cm' }}>
                       <input 
                         type="text" 
                         className="w-full text-center border-none outline-none"
                         value={staff.totalAmount}
                         onChange={(e) => handleInputChange('staff', staffIndex, 'totalAmount', e.target.value)}
                         style={{ fontSize: '8px' }}
                       />
                       {/* Extra cell for total amount - only show on last row */}
                       {staffIndex === 7 && (
                         <div className="absolute -bottom-6 left-0 right-0 border border-gray-400 p-1 bg-white" style={{ fontSize: '8px' }}>
                           <input 
                             type="text" 
                             className="w-full text-center border-none outline-none"
                             value={formData.staff.reduce((sum, staff) => sum + (parseFloat(staff.totalAmount) || 0), 0)}
                             readOnly
                             style={{ fontSize: '8px' }}
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
               <span className="border-b border-gray-400 inline-block w-96 h-5">
                 {numberToThaiText(formData.staff.reduce((sum, staff) => sum + (parseFloat(staff.totalAmount) || 0), 0))}
               </span>
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

export default OT4A2;
