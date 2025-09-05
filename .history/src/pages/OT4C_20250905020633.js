import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const OT4C = ({ userData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    department: userData?.department || '',
    month: '',
    totalAmount: '',
    dutyType: {
      daily: false,
      hourly: false
    },
    staff: Array.from({ length: 10 }, (_, i) => ({
      no: '',
      name: '',
      rate: '',
      days: Array.from({ length: 31 }, () => ''),
      totalDays: '',
      totalAmount: '',
      performerSignature: '',
      recipientSignature: ''
    }))
  });
  const [dailyStaff, setDailyStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compensationRates, setCompensationRates] = useState({});
  const [shiftData, setShiftData] = useState({});

  // ดึงข้อมูลเจ้าหน้าที่รายวัน
  useEffect(() => {
    if (userData?.department) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    const rates = await fetchCompensationRates();
    const currentShiftData = await fetchShiftData();
    const previousShiftData = await fetchPreviousShiftData();
    await fetchDailyStaff(rates, currentShiftData, previousShiftData);
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

  const fetchPreviousShiftData = async (selectedMonth = null) => {
    try {
      let monthKey;
      if (selectedMonth) {
        const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const monthIndex = monthNames.indexOf(selectedMonth);
        if (monthIndex !== -1) {
          const year = 2025;
          // คำนวณเดือนที่แล้ว
          let prevMonth = monthIndex - 1;
          let prevYear = year;
          if (prevMonth < 0) {
            prevMonth = 11; // ธันวาคม
            prevYear = year - 1;
          }
          monthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        } else {
          const currentDate = new Date();
          let prevMonth = currentDate.getMonth() - 1;
          let prevYear = currentDate.getFullYear();
          if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = prevYear - 1;
          }
          monthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        }
      } else {
        const currentDate = new Date();
        let prevMonth = currentDate.getMonth() - 1;
        let prevYear = 2025;
        if (prevMonth < 0) {
          prevMonth = 11;
          prevYear = 2024;
        }
        monthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
      }
      
      console.log('Fetching previous shift data for monthKey:', monthKey);
      
      // Try 'schedules' collection first (ShiftSchedule)
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        console.log('Previous schedule data found:', data);
        
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
        
        console.log('Converted previous data:', convertedData);
        return convertedData;
      } else {
        console.log('No previous schedule data found for monthKey:', monthKey);
        
        // Try 'oncallSchedules' if not found in 'schedules'
        console.log('Trying previous oncallSchedules...');
        const oncallRef = doc(db, 'oncallSchedules', `${userData.department}-${monthKey}`);
        const oncallDoc = await getDoc(oncallRef);
        
        if (oncallDoc.exists()) {
          const data = oncallDoc.data();
          console.log('Previous oncall data found:', data);
          
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
          
          console.log('Converted previous oncall data:', convertedData);
          return convertedData;
        } else {
          console.log('No previous oncall data found either');
        }
      }
      return {};
    } catch (error) {
      console.error('Error fetching previous shift data:', error);
      return {};
    }
  };

  const fetchDailyStaff = async (rates = {}, currentShiftData = {}, previousShiftData = {}) => {
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
      
      // กรองเฉพาะเจ้าหน้าที่รายวัน
      const dailyStaffList = teamMembers
        .filter(member => staffTypes[member.id] === 'daily')
        .sort((a, b) => a.order - b.order);
      
      setDailyStaff(dailyStaffList);
      
      // อัปเดตฟอร์มด้วยข้อมูลเจ้าหน้าที่รายวัน
      const updatedStaff = Array(8).fill().map((_, index) => {
        if (index < dailyStaffList.length) {
          const member = dailyStaffList[index];
          // ดึงอัตราค่าจ้างตามตำแหน่ง (ใช้เวรรายวัน)
          const rate = rates[member.role]?.dailyShift || '';
          
          // ดึงข้อมูลเวรสำหรับ 31 วัน (เวรทำงานปกติ: ไม่ใช่สีแดงและไม่ใช่ O)
          const days = Array(31).fill('').map((_, dayIndex) => {
            let shiftDataToUse, shiftKey, oncallKey;
            
            // วันที่ 21-31 (index 20-30) ใช้ข้อมูลเดือนที่แล้ว
            if (dayIndex >= 20) {
              shiftDataToUse = previousShiftData;
              shiftKey = `${member.id}-${dayIndex}-shift`;
              oncallKey = `${member.id}-${dayIndex}-oncall`;
            } 
            // วันที่ 1-20 (index 0-19) ใช้ข้อมูลเดือนปัจจุบัน
            else {
              shiftDataToUse = currentShiftData;
              shiftKey = `${member.id}-${dayIndex}-shift`;
              oncallKey = `${member.id}-${dayIndex}-oncall`;
            }
            
            const shiftDataItem = shiftDataToUse[shiftKey];
            const oncallDataItem = shiftDataToUse[oncallKey];
            
            const shiftValue = shiftDataItem?.value || '';
            const oncallValue = oncallDataItem?.value || '';
            
            // ตรวจสอบสีของเวร - ต้องไม่ใช่สีแดง (#ff0000)
            const isShiftNotRed = shiftDataItem?.textColor !== '#ff0000';
            const isOncallNotRed = oncallDataItem?.textColor !== '#ff0000';
            
            let validShiftValue = '';
            let validOncallValue = '';
            
            // ดึงเวรที่ไม่ใช่สีแดงและไม่ใช่ O (เวรทำงานปกติ)
            if (isShiftNotRed && shiftValue !== 'O' && shiftValue !== '') {
              validShiftValue = shiftValue;
            }
            
            if (isOncallNotRed && oncallValue !== 'O' && oncallValue !== '') {
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
          
          // คำนวณจำนวนวันทำงาน (นับเวรที่ไม่ว่าง)
          const totalWorkDays = days.filter(day => day.trim() !== '').length;
          
          // คำนวณจำนวนเงิน (จำนวนวัน × อัตราตอบแทน)
          const totalAmount = totalWorkDays * (parseFloat(rate) || 0);
          
          return {
            no: (index + 1).toString(),
            name: `${member.firstName} ${member.lastName}`,
            rate: rate,
            days: days,
            totalDays: totalWorkDays.toString(),
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
      console.error('Error fetching daily staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (section, index, field, value) => {
    if (section === '') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // ถ้าเปลี่ยนเดือน ให้โหลดข้อมูลเวรใหม่
      if (field === 'month' && value) {
        const newCurrentShiftData = await fetchShiftData(value);
        const newPreviousShiftData = await fetchPreviousShiftData(value);
        await updateStaffWithShiftData(newCurrentShiftData, newPreviousShiftData);
      }
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
        [section]: prev[section].map((item, i) => 
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
    }
  };

  const updateStaffWithShiftData = async (currentShiftData = {}, previousShiftData = {}) => {
    if (dailyStaff.length === 0) return;
    
    const updatedStaff = formData.staff.map((staff, index) => {
      if (index < dailyStaff.length) {
        const member = dailyStaff[index];
        
        // ดึงข้อมูลเวรสำหรับ 31 วัน (เวรทำงานปกติ: ไม่ใช่สีแดงและไม่ใช่ O)
        const days = Array(31).fill('').map((_, dayIndex) => {
          let shiftDataToUse, shiftKey, oncallKey;
          
          // วันที่ 21-31 (index 20-30) ใช้ข้อมูลเดือนที่แล้ว
          if (dayIndex >= 20) {
            shiftDataToUse = previousShiftData;
            shiftKey = `${member.id}-${dayIndex}-shift`;
            oncallKey = `${member.id}-${dayIndex}-oncall`;
          } 
          // วันที่ 1-20 (index 0-19) ใช้ข้อมูลเดือนปัจจุบัน
          else {
            shiftDataToUse = currentShiftData;
            shiftKey = `${member.id}-${dayIndex}-shift`;
            oncallKey = `${member.id}-${dayIndex}-oncall`;
          }
          
          const shiftDataItem = shiftDataToUse[shiftKey];
          const oncallDataItem = shiftDataToUse[oncallKey];
          
          const shiftValue = shiftDataItem?.value || '';
          const oncallValue = oncallDataItem?.value || '';
          
          // ตรวจสอบสีของเวร - ต้องไม่ใช่สีแดง (#ff0000)
          const isShiftNotRed = shiftDataItem?.textColor !== '#ff0000';
          const isOncallNotRed = oncallDataItem?.textColor !== '#ff0000';
          
          let validShiftValue = '';
          let validOncallValue = '';
          
          // ดึงเวรที่ไม่ใช่สีแดงและไม่ใช่ O (เวรทำงานปกติ)
          if (isShiftNotRed && shiftValue !== 'O' && shiftValue !== '') {
            validShiftValue = shiftValue;
          }
          
          if (isOncallNotRed && oncallValue !== 'O' && oncallValue !== '') {
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
        
        // คำนวณจำนวนวันทำงาน (นับเวรที่ไม่ว่าง)
        const totalWorkDays = days.filter(day => day.trim() !== '').length;
        
        // คำนวณจำนวนเงิน (จำนวนวัน × อัตราตอบแทน)
        const totalAmount = totalWorkDays * (parseFloat(staff.rate) || 0);
        
        return {
          ...staff,
          days: days,
          totalDays: totalWorkDays.toString(),
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
              // คำนวณจำนวนวันทำงานใหม่
              totalDays: item.days.map((day, j) => 
                j === dayIndex ? value : day
              ).filter(day => day.trim() !== '').length.toString(),
              // คำนวณจำนวนเงินใหม่ (จำนวนวัน × อัตราตอบแทน)
              totalAmount: (item.days.map((day, j) => 
                j === dayIndex ? value : day
              ).filter(day => day.trim() !== '').length * (parseFloat(item.rate) || 0)).toString()
            } 
          : item
      )
    }));
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
            แบบฟอร์ม OT-4C รายวัน วันทำการ
            {dailyStaff.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (เจ้าหน้าที่รายวัน {dailyStaff.length} คน)
              </span>
            )}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-300 p-6">
          {/* Title */}
          <div className="mb-6 relative">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-4">หลักฐานการจ่ายเงินค่าตอบแทนการปฏิบัติงาน</h2>
              
              {/* Duty Type Checkboxes */}
              <div className="flex justify-center space-x-8 mb-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={formData.dutyType.daily}
                    onChange={(e) => handleInputChange('dutyType', '', 'daily', e.target.checked)}
                  />
                  <span className="text-sm">ลูกจ้างชั่วคราวรายวัน</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={formData.dutyType.hourly}
                    onChange={(e) => handleInputChange('dutyType', '', 'hourly', e.target.checked)}
                  />
                  <span className="text-sm">ลูกจ้างรายคาบ</span>
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
              <p className="text-sm font-bold">แบบฟอร์ม OT - 4C</p>
            </div>
          </div>

          {/* Main Table */}
          <div>
            <table className="w-full border border-gray-400" style={{ fontSize: '8px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลำดับ</th>
                  <th className="border border-gray-400 p-1" style={{ width: '3cm', fontSize: '8px' }}>ชื่อ - สกุล</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>อัตราค่าจ้าง</th>
                  <th className="border border-gray-400 p-1 text-center" colSpan="31" style={{ fontSize: '8px' }}>วันที่ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>รวมวัน/ชม.</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>รวมเงิน</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลายมือชื่อผู้ปฏิบัติงานจริง</th>
                  <th className="border border-gray-400 p-1" style={{ width: '0.8cm', fontSize: '6px' }}>ลายมือชื่อผู้รับเงิน</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  <th className="border border-gray-400 p-1" style={{ fontSize: '6px' }}></th>
                  {/* Days 21-31 (previous month) */}
                  {Array.from({ length: 11 }, (_, i) => (
                    <th key={i} className="border border-gray-400 p-1 w-6 text-center" style={{ fontSize: '8px' }}>
                      {i + 21}
                    </th>
                  ))}
                  {/* Days 1-20 (current month) */}
                  {Array.from({ length: 20 }, (_, i) => (
                    <th key={i + 11} className="border border-gray-400 p-1 w-6 text-center" style={{ fontSize: '8px' }}>
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
                    {/* Days 21-31 (previous month) */}
                    {staff.days.slice(20, 31).map((day, dayIndex) => (
                      <td key={dayIndex} className="border border-gray-400 p-1 w-6">
                        <input 
                          type="text" 
                          className="w-full text-center border-none outline-none"
                          value={day}
                          onChange={(e) => handleDayChange(staffIndex, dayIndex + 20, e.target.value)}
                        />
                      </td>
                    ))}
                    {/* Days 1-20 (current month) */}
                    {staff.days.slice(0, 20).map((day, dayIndex) => (
                      <td key={dayIndex + 11} className="border border-gray-400 p-1 w-6">
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
                       {staffIndex === 9 && (
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

          {/* Notes Section */}
          <div className="mt-6">
            <div className="text-left">
              <p className="text-xs">หมายเหตุ 1.ให้ลงจำนวนชั่วโมงที่ปฏิบัติงานในแต่ละวัน</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            {/* Left Signature Section */}
            <div className="text-center">
              <p className="text-xs mb-4">ขอรับรองว่า ผู้มีรายชื่อข้างต้นปฏิบัติงานจริงตามที่ขอเบิกจริง</p>
              
              <div className="space-y-4">
                <div>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">ลงชื่อ หัวหน้าผู้ควบคุม</p>
                  <p className="text-xs">(_____________________)</p>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">ตำแหน่ง</p>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">วันที่</p>
                </div>
              </div>
            </div>

            {/* Right Signature Section */}
            <div className="text-center">
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2">ตรวจสอบแล้วถูกต้อง</p>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">ลงชื่อ ผู้ขออนุมัติ</p>
                  <p className="text-xs">(_____________________)</p>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">ตำแหน่ง</p>
                  <div className="border-b border-gray-400 mb-2 h-4 w-48 mx-auto"></div>
                  <p className="text-xs">วันที่</p>
                </div>
              </div>
            </div>
                     </div>
         </div>

         {/* Action Buttons */}
         <div className="flex justify-center space-x-4 mt-6 no-print">
          <button
            onClick={() => navigate('/payroll')}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            กลับ
          </button>
          <button
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            บันทึก
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            พิมพ์
          </button>
        </div>
      </div>
    </div>
  );
};

export default OT4C;
