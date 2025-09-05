import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShiftSchedule = ({ userData }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [cellValues, setCellValues] = useState({});
  const [shiftOptions, setShiftOptions] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'nurses', 'assistants'
  const [holidays, setHolidays] = useState([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ dates: [] });
  const [holidayMessage, setHolidayMessage] = useState({ text: '', type: '' }); // 'success', 'error', 'info'
  
  // แถบเครื่องมือ
  const [selectedCell, setSelectedCell] = useState(null); // ช่องที่เลือก
  const [selectedCells, setSelectedCells] = useState([]); // ช่องที่เลือกหลายช่อง
  const [textColor, setTextColor] = useState('#000000'); // สีตัวอักษร (ดำ)
  const [fontSize, setFontSize] = useState(14); // ขนาดตัวอักษร
  const [history, setHistory] = useState([]); // ประวัติการเปลี่ยนแปลง (เก็บ 5 ครั้ง)
  const [isScheduleSaved, setIsScheduleSaved] = useState(false); // สถานะการบันทึกตารางเวร
  
  // โหมดภาพรวม
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [overviewType, setOverviewType] = useState('nurses'); // 'nurses', 'assistants'
  const [overviewImage, setOverviewImage] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (userData?.department) {
      fetchTeamMembers();
      fetchShiftOptions();
      // โหลดข้อมูลวันหยุดจาก Firebase เมื่อเริ่มต้น
      loadHolidaysFromFirebase();
    }
  }, [userData]);






  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team for department:', userData.department);
      const teamRef = doc(db, 'teams', userData.department);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        console.log('Team data:', teamData);
        const members = teamData.members || [];
        console.log('Team members:', members);
        setTeamMembers(members);
        setDebugInfo(`พบสมาชิกในทีม ${members.length} คน`);
      } else {
        console.log('No team document found');
        setDebugInfo('ไม่พบข้อมูลทีม');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setDebugInfo(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftOptions = async () => {
    try {
      const shiftOptionsRef = doc(db, 'shiftOptions', userData.department);
      const shiftOptionsDoc = await getDoc(shiftOptionsRef);
      
      if (shiftOptionsDoc.exists()) {
        const options = shiftOptionsDoc.data().options || [];
        setShiftOptions(options);
      }
    } catch (error) {
      console.error('Error fetching shift options:', error);
    }
  };







  // โหลดข้อมูลวันหยุดจาก Firebase
  const loadHolidaysFromFirebase = async (targetDate = currentMonth) => {
    try {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      const holidaysRef = doc(db, 'holidays', `${userData.department}-${monthKey}`);
      const holidaysDoc = await getDoc(holidaysRef);
      
      if (holidaysDoc.exists()) {
        const savedHolidays = holidaysDoc.data().holidays || [];
        setHolidays(savedHolidays);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error loading holidays from Firebase:', error);
      setHolidays([]);
    }
  };

  // บันทึกวันหยุดลง Firebase
  const saveHolidaysToFirebase = async (holidaysData) => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      const holidaysRef = doc(db, 'holidays', `${userData.department}-${monthKey}`);
      await setDoc(holidaysRef, {
        department: userData.department,
        monthKey: monthKey,
        holidays: holidaysData,
        updatedAt: new Date()
      });
      
      console.log('บันทึกวันหยุดลง Firebase แล้ว');
    } catch (error) {
      console.error('Error saving holidays to Firebase:', error);
    }
  };





    // ฟังก์ชันสำหรับแถบเครื่องมือ
  
  // เลือกช่อง
  const selectCell = (memberId, dayIndex, rowType, event) => {
    const cellKey = `${memberId}-${dayIndex}-${rowType}`;
    
    // ถ้ากด Ctrl ให้เลือกหลายช่อง
    if (event.ctrlKey || event.metaKey) {
      setSelectedCells(prev => {
        if (prev.includes(cellKey)) {
          // ถ้าช่องนี้ถูกเลือกอยู่แล้ว ให้ลบออก
          return prev.filter(key => key !== cellKey);
        } else {
          // ถ้าช่องนี้ยังไม่ถูกเลือก ให้เพิ่มเข้าไป
          return [...prev, cellKey];
        }
      });
      setSelectedCell(cellKey); // ยังคงเลือกช่องล่าสุดเป็นหลัก
    } else {
      // ถ้าไม่กด Ctrl ให้เลือกช่องเดียว
      setSelectedCell(cellKey);
      setSelectedCells([cellKey]);
    }
    
    console.log('เลือกช่อง:', cellKey, 'Ctrl:', event.ctrlKey || event.metaKey);
  };
  
  // เปลี่ยนสีตัวอักษร
  const changeTextColor = (color) => {
    setTextColor(color);
    
    // เปลี่ยนสีในช่องที่เลือกทั้งหมด
    const cellsToUpdate = selectedCells.length > 0 ? selectedCells : [selectedCell];
    
    cellsToUpdate.forEach(cellKey => {
      if (cellKey) {
        // บันทึกประวัติ
        addToHistory({
          type: 'changeColor',
          cellKey: cellKey,
          oldValue: cellValues[cellKey] || '',
          newValue: cellValues[cellKey] || '',
          oldColor: textColor,
          newColor: color
        });
        
        // อัปเดตสีในช่องที่เลือก
        updateCellStyle(cellKey, color, fontSize);
      }
    });
  };
  
  // เปลี่ยนขนาดตัวอักษร
  const changeFontSize = (size) => {
    setFontSize(size);
    
    // เปลี่ยนขนาดในช่องที่เลือกทั้งหมด
    const cellsToUpdate = selectedCells.length > 0 ? selectedCells : [selectedCell];
    
    cellsToUpdate.forEach(cellKey => {
      if (cellKey) {
        // บันทึกประวัติ
        addToHistory({
          type: 'changeFontSize',
          cellKey: cellKey,
          oldValue: cellValues[cellKey] || '',
          newValue: cellValues[cellKey] || '',
          oldSize: fontSize,
          newSize: size
        });
        
        // อัปเดตสไตล์ในช่องที่เลือก
        updateCellStyle(cellKey, textColor, size);
      }
    });
  };
  

  
  // บันทึกตารางเวรทั้งหมดลง Firebase
  const saveScheduleToFirebase = async () => {
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      
      // สร้างข้อมูลตารางเวร
      const scheduleData = {};
      
      // บันทึกข้อมูลจาก cellValues ทั้งหมด
      Object.keys(cellValues).forEach(cellKey => {
        const [memberId, dayIndex, rowType] = cellKey.split('-');
        if (!scheduleData[memberId]) {
          scheduleData[memberId] = {};
        }
        if (!scheduleData[memberId][dayIndex]) {
          scheduleData[memberId][dayIndex] = {};
        }
        scheduleData[memberId][dayIndex][rowType] = cellValues[cellKey];
      });
      
      // บันทึกลง Firebase
      await setDoc(scheduleRef, {
        department: userData.department,
        monthKey: monthKey,
        schedule: scheduleData,
        updatedAt: new Date(),
        updatedBy: userData.username
      });
      
      // แจ้งเตือนสำเร็จ
      setHolidayMessage({ 
        text: 'บันทึกตารางเวรสำเร็จ', 
        type: 'success' 
      });
      
      // เปลี่ยนสถานะเป็นบันทึกแล้ว
      setIsScheduleSaved(true);
      
      console.log('บันทึกตารางเวรสำเร็จ');
    } catch (error) {
      console.error('Error saving schedule:', error);
      setHolidayMessage({ 
        text: 'เกิดข้อผิดพลาดในการบันทึกตารางเวร', 
        type: 'error' 
      });
    }
  };
  
  // เพิ่มเวรในช่องที่เลือก
  const addShiftToSelectedCell = (shiftName) => {
    // ใส่เวรในช่องที่เลือกทั้งหมด
    const cellsToUpdate = selectedCells.length > 0 ? selectedCells : [selectedCell];
    
    cellsToUpdate.forEach(cellKey => {
      if (cellKey) {
        const oldValue = cellValues[cellKey] || '';
        
        // บันทึกประวัติ
        addToHistory({
          type: 'addShift',
          cellKey: cellKey,
          oldValue: oldValue,
          newValue: shiftName
        });
        
        // อัปเดตค่าในช่อง
        setCellValues(prev => ({
          ...prev,
          [cellKey]: shiftName
        }));
        
        // บันทึกลง Firebase
        const [memberId, dayIndex, rowType] = cellKey.split('-');
        saveCellValue(memberId, parseInt(dayIndex), rowType, shiftName);
      }
    });
    
    // ตรวจจับการเปลี่ยนแปลงในตารางเวร
    handleScheduleChange();
  };
  
  // อัปเดตสไตล์ของช่อง
  const updateCellStyle = (cellKey, color, size) => {
    // อัปเดตสไตล์ในช่องที่เลือก
    // (จะทำในส่วนของ render)
  };

  // เก็บข้อมูลสไตล์ของแต่ละช่อง
  const [cellStyles, setCellStyles] = useState({});
  
  // เพิ่มประวัติ
  const addToHistory = (action) => {
    setHistory(prev => {
      const newHistory = [...prev, { ...action, timestamp: Date.now() }];
      // เก็บแค่ 5 ครั้งล่าสุด
      return newHistory.slice(-5);
    });
  };
  
  // ย้อนกลับ
  const undo = () => {
    if (history.length > 0) {
      const lastAction = history[history.length - 1];
      
      // ย้อนการเปลี่ยนแปลงตามประเภท
      switch (lastAction.type) {
        case 'addShift':
        case 'editShift':
        case 'typeShift': // เพิ่มการรองรับการพิมพ์เอง
          setCellValues(prev => ({
            ...prev,
            [lastAction.cellKey]: lastAction.oldValue
          }));
          
          // บันทึกลง Firebase ด้วย
          const [memberId, dayIndex, rowType] = lastAction.cellKey.split('-');
          const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
          
          updateDoc(scheduleRef, {
            [`${memberId}.${dayIndex}.${rowType}`]: lastAction.oldValue
          }).catch(error => {
            console.error('Error undoing schedule change:', error);
          });
          break;
        case 'changeColor':
          setTextColor(lastAction.oldColor);
          break;
        case 'changeFontSize':
          setFontSize(lastAction.oldSize);
          break;
        default:
          break;
      }
      
      // ลบประวัติล่าสุด
      setHistory(prev => prev.slice(0, -1));
    }
  };
  
  // แสดงโหมดภาพรวม
  const showOverview = async () => {
    console.log('Opening overview modal');
    console.log('Team members:', teamMembers);
    console.log('Cell values:', cellValues);
    console.log('Overview type:', overviewType);
    
    // โหลดข้อมูลเวรจาก Firebase ก่อนเปิด Modal
    await loadScheduleFromFirebase();
    
    setShowOverviewModal(true);
  };
  
  // โหลดข้อมูลเวรจาก Firebase
  const loadScheduleFromFirebase = async () => {
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        console.log('Loaded schedule data:', scheduleData);
        
        // แปลงข้อมูลจาก Firebase เป็น cellValues format
        const newCellValues = {};
        if (scheduleData.schedule) {
          Object.keys(scheduleData.schedule).forEach(memberId => {
            Object.keys(scheduleData.schedule[memberId]).forEach(dayIndex => {
              Object.keys(scheduleData.schedule[memberId][dayIndex]).forEach(rowType => {
                const cellKey = `${memberId}-${dayIndex}-${rowType}`;
                newCellValues[cellKey] = scheduleData.schedule[memberId][dayIndex][rowType];
              });
            });
          });
        }
        
        setCellValues(newCellValues);
        console.log('Updated cellValues:', newCellValues);
      } else {
        console.log('No schedule data found for month:', monthKey);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  // บันทึกภาพภาพรวม
  const saveOverviewImage = async () => {
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      
      // หาตารางที่ต้องการบันทึก
      const tableElement = document.querySelector('.bg-gray-50.p-4.rounded-lg table');
      if (!tableElement) {
        throw new Error('ไม่พบตารางสำหรับสร้างรูปภาพ');
      }
      
      // สร้าง HTML string ของตาราง
      const tableHTML = tableElement.outerHTML;
      
      // บันทึกเฉพาะตารางที่เลือก (พยาบาล หรือ ผู้ช่วย)
      const overviewRef = doc(db, 'schedulesBeforeExchange', `${userData.department}-${monthKey}-${overviewType}`);
      await setDoc(overviewRef, {
        department: userData.department,
        monthKey: monthKey,
        overviewType: overviewType,
        savedAt: new Date(),
        savedBy: userData.username,
        type: 'overview',
        tableHTML: tableHTML,
        isReadOnly: true
      });
      
      const typeText = overviewType === 'nurses' ? 'พยาบาล' : 'ผู้ช่วย';
      setHolidayMessage({ 
        text: `บันทึกภาพรวม${typeText}สำเร็จ`, 
        type: 'success' 
      });
      
      setShowOverviewModal(false);
      console.log(`บันทึกภาพรวม${typeText}สำเร็จ`);
      
    } catch (error) {
      console.error('Error saving overview:', error);
      setHolidayMessage({ 
        text: 'เกิดข้อผิดพลาดในการบันทึกภาพรวม', 
        type: 'error' 
      });
    }
  };

  // เพิ่มวันหยุดใหม่
  const addCustomHoliday = async () => {
    if (newHoliday.dates.length > 0) {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const newHolidays = [];
      
      for (const date of newHoliday.dates) {
        // ตรวจสอบว่าวันหยุดนี้มีอยู่แล้วหรือไม่
        const existingHoliday = holidays.find(h => h.date === date);
        if (existingHoliday) {
          continue; // ข้ามวันที่มีอยู่แล้ว
        }
        
        const holiday = {
          date: date,
          name: 'วันหยุด', // ใช้ชื่อคงที่
          type: 'custom'
        };
        
        newHolidays.push(holiday);
      }
      
      if (newHolidays.length > 0) {
        const updatedHolidays = [...holidays, ...newHolidays];
        setHolidays(updatedHolidays);
        
        // บันทึกลง Firebase ทันที
        await saveHolidaysToFirebase(updatedHolidays);
        
        setHolidayMessage({ 
          text: `เพิ่มวันหยุดสำเร็จ ${newHolidays.length} วัน`, 
          type: 'success' 
        });
        
        // ปิด Modal และรีเซ็ตข้อมูล
        setNewHoliday({ dates: [] });
        setShowAddHolidayModal(false);
      }
    }
  };

  // ลบวันหยุด
  const removeHoliday = async (date) => {
    const updatedHolidays = holidays.filter(h => h.date !== date);
    setHolidays(updatedHolidays);
    
    // บันทึกลง Firebase
    await saveHolidaysToFirebase(updatedHolidays);
  };

  // จัดการการเลือกวันที่
  const toggleDateSelection = (date) => {
    setNewHoliday(prev => {
      const isSelected = prev.dates.includes(date);
      if (isSelected) {
        return { ...prev, dates: prev.dates.filter(d => d !== date) };
      } else {
        return { ...prev, dates: [...prev.dates, date] };
      }
    });
  };

  // คำนวณจำนวนวันทำการ (จันทร์-ศุกร์ ที่ไม่ใช่วันหยุด)
  const calculateWorkingDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
      
      // ตรวจสอบว่าเป็นวันทำงาน (จันทร์-ศุกร์) หรือไม่
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      // ตรวจสอบว่าเป็นวันหยุดหรือไม่
      const isHolidayDate = holidays.some(h => h.date === day);
      
      // ถ้าเป็นวันทำงานและไม่ใช่วันหยุด ให้นับเป็นวันทำการ
      if (isWeekday && !isHolidayDate) {
        workingDays++;
      }
    }
    
    return workingDays;
  };

  // สร้างวันที่ในเดือน
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // อาทิตย์หรือเสาร์
      
      days.push({
        day,
        dayOfWeek: dayNames[dayOfWeek],
        isWeekend
      });
    }
    
    return days;
  };

  // แยกเจ้าหน้าที่ตามตำแหน่ง
  const nurses = teamMembers.filter(member => member.role === 'พยาบาล');
  const nursingAssistants = teamMembers.filter(member => member.role === 'ผู้ช่วยพยาบาล');
  const patientHelpers = teamMembers.filter(member => member.role === 'พนักงานผู้ช่วยเหลือคนไข้');
  const assistants = teamMembers.filter(member => 
    member.role === 'ผู้ช่วยพยาบาล' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้'
  );

  // นับเวรในแถวสรุป
  const countShiftsForDay = (dayIndex, memberList) => {
    const counts = {};
    
    // เริ่มต้นด้วย 0 สำหรับทุกเวรที่เปิด "นับในสรุป"
    shiftOptions.forEach(option => {
      if (option.includeInTeam) {
        counts[option.name] = 0;
      }
    });

    // นับเวรจากทุกคนในทีม
    memberList.forEach(member => {
      // นับจากแถวบน
      const topCellKey = `${member.id}-${dayIndex}-top`;
      const topValue = cellValues[topCellKey] || '';
      if (topValue && counts.hasOwnProperty(topValue)) {
        counts[topValue]++;
      }

      // นับจากแถวล่าง
      const bottomCellKey = `${member.id}-${dayIndex}-bottom`;
      const bottomValue = cellValues[bottomCellKey] || '';
      if (bottomValue && counts.hasOwnProperty(bottomValue)) {
        counts[bottomValue]++;
      }
    });

    return counts;
  };

  // หาสีของเวร
  const getShiftStyle = (shiftName) => {
    // ถ้าไม่มีข้อความ ไม่ต้องแสดงสี
    if (!shiftName || shiftName.trim() === '') {
      return {
        color: '#000000',
        backgroundColor: '#ffffff'
      };
    }
    
    const shiftOption = shiftOptions.find(option => option.name === shiftName);
    if (shiftOption) {
      return {
        color: shiftOption.textColor || '#000000',
        backgroundColor: shiftOption.backgroundColor || '#ffffff'
      };
    }
    
    // คำอื่นที่ไม่มีในตั้งค่าเวร (เช่น ประชุม, อบรม) = อักษรดำพื้นฟ้าอ่อน
    return {
      color: '#000000',
      backgroundColor: '#e0f2fe'
    };
  };

  // ตรวจสอบว่าเป็นวันหยุดหรือไม่
  const isHoliday = (day) => {
    return holidays.some(holiday => holiday.date === day);
  };

  // หาสีพื้นหลังของคอลัมน์วันที่
  const getDayBackgroundColor = (day) => {
    if (isHoliday(day)) {
      return 'bg-orange-100'; // สีส้มอ่อนสำหรับวันหยุด
    }
    return '';
  };

  // เปลี่ยนเดือน
  const changeMonth = async (direction) => {
    // รีเซ็ตสถานะและข้อมูลวันหยุดเมื่อเปลี่ยนเดือน
    setHolidayMessage({ text: '', type: '' });
    setHolidays([]); // ล้างข้อมูลวันหยุดของเดือนก่อนหน้า
    
    // เปลี่ยนเดือน
    const newDate = new Date(currentMonth);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
    
    // อัปเดตเดือน
    setCurrentMonth(newDate);
    
    // โหลดข้อมูลวันหยุดของเดือนใหม่ทันที
    if (userData?.department) {
      await loadHolidaysFromFirebase(newDate);
    }
  };

  // เริ่มแก้ไขเซลล์
  const startEditing = (memberId, dayIndex, rowType = 'shift') => {
    const cellKey = `${memberId}-${dayIndex}-${rowType}`;
    setEditingCell(cellKey);
    setCellValues(prev => ({
      ...prev,
      [cellKey]: prev[cellKey] || ''
    }));
  };

    // ตรวจจับการเปลี่ยนแปลงในตารางเวร
  const handleScheduleChange = () => {
    if (isScheduleSaved) {
      setIsScheduleSaved(false);
    }
  };
  
  // บันทึกค่าเซลล์
  const saveCellValue = async (memberId, dayIndex, rowType = 'shift', value) => {
    const cellKey = `${memberId}-${dayIndex}-${rowType}`;
    const oldValue = cellValues[cellKey] || '';
    
    // บันทึกประวัติการเปลี่ยนแปลง
    if (oldValue !== value) {
      // ตรวจสอบว่าเป็นการพิมพ์เองหรือกดปุ่ม
      const isTypedManually = !shiftOptions.some(option => option.name === value);
      
      addToHistory({
        type: isTypedManually ? 'typeShift' : 'editShift',
        cellKey: cellKey,
        oldValue: oldValue,
        newValue: value
      });
      
      // ตรวจจับการเปลี่ยนแปลงในตารางเวร
      handleScheduleChange();
    }
    
    setCellValues(prev => ({
      ...prev,
      [cellKey]: value
    }));
    setEditingCell(null);

    // บันทึกลง Firebase
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const scheduleRef = doc(db, 'schedules', `${userData.department}-${monthKey}`);

      await updateDoc(scheduleRef, {
        [`${memberId}.${dayIndex}.${rowType}`]: value
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  // จัดการการกดปุ่ม
  const handleKeyDown = (e, memberId, dayIndex, rowType = 'top') => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const value = e.target.value;
      saveCellValue(memberId, dayIndex, rowType, value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentCell = editingCell;
      if (!currentCell) return;

      const [currentMemberId, currentDayIndex, currentRowType] = currentCell.split('-');
      let newMemberId = currentMemberId;
      let newDayIndex = parseInt(currentDayIndex);
      let newRowType = currentRowType || 'top';

      if (e.key === 'ArrowUp') {
        // เลื่อนขึ้นไปแถวบนของคนเดียวกัน หรือไปคนก่อนหน้า
        if (currentRowType === 'bottom') {
          newRowType = 'top';
        } else {
          const currentMemberIndex = teamMembers.findIndex(m => m.id === currentMemberId);
          if (currentMemberIndex > 0) {
            newMemberId = teamMembers[currentMemberIndex - 1].id;
            newRowType = 'bottom';
          }
        }
      } else if (e.key === 'ArrowDown') {
        // เลื่อนลงไปแถวล่างของคนเดียวกัน หรือไปคนถัดไป
        if (currentRowType === 'top') {
          newRowType = 'bottom';
        } else {
          const currentMemberIndex = teamMembers.findIndex(m => m.id === currentMemberId);
          if (currentMemberIndex < teamMembers.length - 1) {
            newMemberId = teamMembers[currentMemberIndex + 1].id;
            newRowType = 'top';
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (newDayIndex > 0) {
          newDayIndex = newDayIndex - 1;
        }
      } else if (e.key === 'ArrowRight') {
        if (newDayIndex < days.length - 1) {
          newDayIndex = newDayIndex + 1;
        }
      }

      const newCellKey = `${newMemberId}-${newDayIndex}-${newRowType}`;
      setEditingCell(newCellKey);
      setCellValues(prev => ({
        ...prev,
        [newCellKey]: prev[newCellKey] || ''
      }));
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

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
        {/* หัวข้อและปุ่มเปลี่ยนเดือน */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                      <div className="grid grid-cols-3 items-center mb-4">
              <div className="flex justify-start gap-3">
                <button
                  onClick={() => saveScheduleToFirebase()}
                  disabled={isScheduleSaved}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isScheduleSaved
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <span className="text-xs">{isScheduleSaved ? 'บันทึกแล้ว' : 'บันทึกตารางเวร'}</span>
                </button>
                

                
                <button
                  onClick={() => setShowAddHolidayModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <span className="text-xs">เพิ่มวันหยุด</span>
                </button>
                
                <button
                  onClick={showOverview}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <span className="text-xs">ดูภาพรวม</span>
                </button>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 text-center">ตารางเวร</h1>
              <div className="flex items-center gap-4 justify-end">
                <button
                  onClick={() => changeMonth('prev')}
                  className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl font-semibold text-gray-700">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => changeMonth('next')}
                  className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            
            {/* ตัวเลือกการแสดงผลตารางเวร */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">จำนวนวันทำการ:</span> {calculateWorkingDays()} วัน
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">แสดงตารางเวร:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="nurses">พยาบาลเท่านั้น</option>
                  <option value="assistants">ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้เท่านั้น</option>
                </select>
              </div>
            </div>
            
            {/* แถบเครื่องมือ */}
            <div className="flex items-center justify-center gap-6 bg-gray-100 px-6 py-3 rounded-lg mb-6">
              {/* สีตัวอักษร */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">สีตัวอักษร:</span>
                <button
                  onClick={() => changeTextColor('#ff0000')}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    textColor === '#ff0000' ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: '#ff0000' }}
                  title="อักษรสีแดง"
                />
                <button
                  onClick={() => changeTextColor('#000000')}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    textColor === '#000000' ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: '#000000' }}
                  title="อักษรสีดำ"
                />
              </div>
              
              {/* ขนาดตัวอักษร */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">ขนาดตัวอักษร:</span>
                <button
                  onClick={() => changeFontSize(8)}
                  className={`px-4 py-2 rounded text-white font-medium transition-all ${
                    fontSize === 8 ? 'bg-blue-600 scale-110' : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  8
                </button>
                <button
                  onClick={() => changeFontSize(14)}
                  className={`px-4 py-2 rounded text-white font-medium transition-all ${
                    fontSize === 14 ? 'bg-blue-600 scale-110' : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  14
                </button>
              </div>
              
              {/* ปุ่มเวร */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">ใส่เวร:</span>
                {shiftOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => addShiftToSelectedCell(option.name)}
                    className="px-3 py-2 rounded text-white font-medium text-sm transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: option.backgroundColor || '#6b7280',
                      color: option.textColor || '#ffffff'
                    }}
                    title={option.name}
                  >
                    {option.name}
                  </button>
                ))}
                
                {/* ปุ่มเวร ช/บ/ด สีแดง */}
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-medium text-gray-700">เวรสีแดง:</span>
                  <button
                    onClick={() => addShiftToSelectedCell('ช')}
                    className="px-3 py-2 rounded text-white font-medium text-sm transition-all hover:scale-105 bg-red-600 hover:bg-red-700"
                    title="ช (สีแดง)"
                  >
                    ช
                  </button>
                  <button
                    onClick={() => addShiftToSelectedCell('บ')}
                    className="px-3 py-2 rounded text-white font-medium text-sm transition-all hover:scale-105 bg-red-600 hover:bg-red-700"
                    title="บ (สีแดง)"
                  >
                    บ
                  </button>
                  <button
                    onClick={() => addShiftToSelectedCell('ด')}
                    className="px-3 py-2 rounded text-white font-medium text-sm transition-all hover:scale-105 bg-red-600 hover:bg-red-700"
                    title="ด (สีแดง)"
                  >
                    ด
                  </button>
                </div>
              </div>
              
              {/* ปุ่มย้อนกลับ */}
              <div className="flex items-center gap-3">
                <button
                  onClick={undo}
                  disabled={history.length === 0}
                  className={`px-4 py-2 rounded text-white font-medium transition-all flex items-center gap-2 ${
                    history.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  ย้อนกลับ ({history.length}/5)
                </button>
              </div>
            </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-blue-200/50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">ยังไม่มีสมาชิกในทีม</p>
            <p className="text-slate-500 text-sm mt-1">กรุณาตั้งค่าทีมในหน้า "ตั้งค่า" ก่อน</p>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/settings'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ไปหน้า Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ตารางพยาบาล */}
            {nurses.length > 0 && (viewMode === 'all' || viewMode === 'nurses') && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                <div className="bg-blue-100 text-blue-800 p-4 border-l-4 border-blue-400">
                  <h2 className="text-xl font-semibold text-center">พยาบาล ({nurses.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${
                            isHoliday(day.day) ? 'bg-orange-100' : 
                            day.isWeekend ? 'bg-yellow-100' : ''
                          }`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurses.map((nurse, index) => (
                        <React.Fragment key={nurse.id}>
                          {/* แถวที่ 1: ช่องเวรบน */}
                          <tr className="h-8">
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium align-middle">
                              {nurse.firstName} {nurse.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${nurse.id}-${dayIndex}-top`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${
                                    isHoliday(day.day) ? 'bg-orange-50' : 
                                    day.isWeekend ? 'bg-yellow-50' : ''
                                  } ${
                                    selectedCell === `${nurse.id}-${dayIndex}-top` ? 'ring-2 ring-blue-500 bg-blue-100' : 
                                    selectedCells.includes(`${nurse.id}-${dayIndex}-top`) ? 'ring-2 ring-green-500 bg-green-100' : ''
                                  }`}
                                  onClick={(e) => {
                                    selectCell(nurse.id, dayIndex, 'top', e);
                                    startEditing(nurse.id, dayIndex, 'top');
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, nurse.id, dayIndex, 'top')}
                                      onBlur={() => saveCellValue(nurse.id, dayIndex, 'top', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                              </td>
                              );
                            })}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                          </tr>
                          {/* แถวที่ 2: ช่องเวรล่าง */}
                          <tr className="h-8 border-b-2 border-gray-400">
                            {days.map((day, dayIndex) => {
                              const cellKey = `${nurse.id}-${dayIndex}-bottom`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${
                                    isHoliday(day.day) ? 'bg-orange-50' : 
                                    day.isWeekend ? 'bg-yellow-50' : ''
                                  } ${
                                    selectedCell === `${nurse.id}-${dayIndex}-bottom` ? 'ring-2 ring-blue-500 bg-blue-100' : 
                                    selectedCells.includes(`${nurse.id}-${dayIndex}-bottom`) ? 'ring-2 ring-green-500 bg-green-100' : ''
                                  }`}
                                  onClick={(e) => {
                                    selectCell(nurse.id, dayIndex, 'bottom', e);
                                    startEditing(nurse.id, dayIndex, 'bottom');
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, nurse.id, dayIndex, 'bottom')}
                                      onBlur={() => saveCellValue(nurse.id, dayIndex, 'bottom', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-blue-50 text-blue-800 border-t-2 border-blue-200">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป พยาบาล
                        </td>
                        {days.map((day, dayIndex) => {
                          const shiftCounts = countShiftsForDay(dayIndex, nurses);
                          return (
                          <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                              {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                <div key={shiftName}>{shiftName}:{count}</div>
                              ))}
                          </td>
                          );
                        })}
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ตารางผู้ช่วยพยาบาลและผู้ช่วยเหลือคนไข้ */}
            {assistants.length > 0 && (viewMode === 'all' || viewMode === 'assistants') && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden">
                <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-400">
                  <h2 className="text-xl font-semibold text-center">ผู้ช่วยพยาบาล / ผู้ช่วยเหลือคนไข้ ({assistants.length} คน)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-xl border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                        {days.map((day, index) => (
                          <th key={index} className={`border border-gray-300 px-2 py-2 text-center w-10 ${
                            isHoliday(day.day) ? 'bg-orange-100' : 
                            day.isWeekend ? 'bg-yellow-100' : ''
                          }`}>
                            <div className="text-sm font-medium">{day.day}</div>
                            <div className="text-xs text-gray-600">{day.dayOfWeek}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">เวรรวม</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">OT</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-16">ค่าเวร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map((assistant, index) => (
                        <React.Fragment key={assistant.id}>
                          {/* แถวที่ 1: ชื่อ */}
                          <tr className="h-8">
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">
                              {index + 1}
                            </td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium align-middle">
                              {assistant.firstName} {assistant.lastName}
                            </td>
                            {days.map((day, dayIndex) => {
                              const cellKey = `${assistant.id}-${dayIndex}-top`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${
                                    isHoliday(day.day) ? 'bg-orange-50' : 
                                    day.isWeekend ? 'bg-yellow-50' : ''
                                  } ${
                                    selectedCell === `${assistant.id}-${dayIndex}-top` ? 'ring-2 ring-blue-500 bg-blue-100' : 
                                    selectedCells.includes(`${assistant.id}-${dayIndex}-top`) ? 'ring-2 ring-green-500 bg-green-100' : ''
                                  }`}
                                  onClick={(e) => {
                                    selectCell(assistant.id, dayIndex, 'top', e);
                                    startEditing(assistant.id, dayIndex, 'top');
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, assistant.id, dayIndex, 'top')}
                                      onBlur={() => saveCellValue(assistant.id, dayIndex, 'top', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                              </td>
                              );
                            })}
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                            <td rowSpan="2" className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">0</td>
                          </tr>
                          {/* แถวที่ 2: ช่องเวรล่าง */}
                          <tr className="h-8 border-b-2 border-gray-400">
                            {days.map((day, dayIndex) => {
                              const cellKey = `${assistant.id}-${dayIndex}-bottom`;
                              const isEditing = editingCell === cellKey;
                              const cellValue = cellValues[cellKey] || '';
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`border border-gray-300 px-1 py-1 text-center cursor-pointer hover:bg-blue-50 ${
                                    isHoliday(day.day) ? 'bg-orange-50' : 
                                    day.isWeekend ? 'bg-yellow-50' : ''
                                  } ${
                                    selectedCell === `${assistant.id}-${dayIndex}-bottom` ? 'ring-2 ring-blue-500 bg-blue-100' : 
                                    selectedCells.includes(`${assistant.id}-${dayIndex}-bottom`) ? 'ring-2 ring-green-500 bg-green-100' : ''
                                  }`}
                                  onClick={(e) => {
                                    selectCell(assistant.id, dayIndex, 'bottom', e);
                                    startEditing(assistant.id, dayIndex, 'bottom');
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cellValue}
                                      onChange={(e) => setCellValues(prev => ({
                                        ...prev,
                                        [cellKey]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleKeyDown(e, assistant.id, dayIndex, 'bottom')}
                                      onBlur={() => saveCellValue(assistant.id, dayIndex, 'bottom', cellValue)}
                                      className="w-full h-full text-center text-sm border-none outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* แถวสรุป */}
                      <tr className="bg-green-50 text-green-800 border-t-2 border-green-200">
                        <td colSpan="2" className="border border-gray-300 px-3 py-2 text-sm font-medium">
                          สรุป ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้
                        </td>
                        {days.map((day, dayIndex) => {
                          const shiftCounts = countShiftsForDay(dayIndex, assistants);
                          return (
                          <td key={dayIndex} className={`border border-gray-300 px-1 py-1 text-center text-xs ${day.isWeekend ? 'bg-yellow-100' : ''}`}>
                              {Object.entries(shiftCounts).map(([shiftName, count]) => (
                                <div key={shiftName}>{shiftName}:{count}</div>
                              ))}
                          </td>
                          );
                        })}
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ป๊อปอัพแจ้งเตือนวันหยุด */}
      {holidayMessage.text && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-xl p-6 w-96 max-w-md border-l-4 ${
            holidayMessage.type === 'success' ? 'border-green-500' :
            holidayMessage.type === 'error' ? 'border-red-500' :
            'border-blue-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                holidayMessage.type === 'success' ? 'bg-green-100' :
                holidayMessage.type === 'error' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {holidayMessage.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : holidayMessage.type === 'error' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  holidayMessage.type === 'success' ? 'text-green-800' :
                  holidayMessage.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {holidayMessage.type === 'success' ? 'สำเร็จ' :
                   holidayMessage.type === 'error' ? 'เกิดข้อผิดพลาด' :
                   'ข้อมูล'}
                </h3>
                <p className="text-gray-600 text-sm">{holidayMessage.text}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setHolidayMessage({ text: '', type: '' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  holidayMessage.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  holidayMessage.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูภาพรวม */}
      {showOverviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[95%] max-w-8xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">โหมดภาพรวมตารางเวร</h3>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* เลือกประเภทตาราง */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">เลือกประเภทตาราง:</label>
                <select
                  value={overviewType}
                  onChange={(e) => setOverviewType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="nurses">ตารางพยาบาล</option>
                  <option value="assistants">ตารางผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้</option>
                </select>
              </div>
              
              {/* แสดงตารางภาพรวม */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  {overviewType === 'nurses' ? 'ภาพรวมตารางพยาบาล' : 'ภาพรวมตารางผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้'}
                </h4>
                
                
                
                {/* ตารางภาพรวม */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-10">No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-40">ชื่อ-นามสกุล</th>
                        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                          const date = i + 1;
                          const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
                          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                          const isHolidayDate = holidays.some(h => h.date === date);
                          
                          return (
                            <th key={date} className={`border border-gray-300 px-2 py-2 text-center w-10 ${
                              isHolidayDate ? 'bg-orange-100' : 
                              isWeekend ? 'bg-yellow-100' : ''
                            }`}>
                              <div className="text-sm font-medium">{date}</div>
                              <div className="text-xs text-gray-600">
                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][currentDate.getDay()]}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                                              {(() => {
                          // แสดงสมาชิกทั้งหมดก่อน แล้วค่อย filter ตามประเภท
                          console.log('All team members:', teamMembers);
                          console.log('Overview type:', overviewType);
                          
                          // Filter สมาชิกตามประเภท
                          const filteredMembers = teamMembers.filter(member => {
                            console.log(`Checking member: ${member.firstName} ${member.lastName}, role: ${member.role}`);
                            
                            if (overviewType === 'nurses') {
                              const isNurse = member.role === 'พยาบาล';
                              console.log(`Is nurse? ${isNurse}`);
                              return isNurse;
                            } else {
                              const isAssistant = member.role === 'ผู้ช่วยพยาบาล' || member.role === 'พนักงานผู้ช่วยเหลือคนไข้';
                              console.log(`Is assistant? ${isAssistant}`);
                              return isAssistant;
                            }
                          });
                          
                          console.log('Filtered members:', filteredMembers);
                          
                          // แสดงสมาชิกที่ filter ได้
                          if (filteredMembers.length === 0) {
                            return (
                              <tr>
                                <td colSpan={33} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                                  ไม่พบเจ้าหน้าที่ในประเภทที่เลือก ({overviewType === 'nurses' ? 'พยาบาล' : 'ผู้ช่วยพยาบาล/ผู้ช่วยเหลือคนไข้'})
                                </td>
                              </tr>
                            );
                          }
                          
                          return filteredMembers.map((member, index) => (
                            <tr key={member.id} className="h-8">
                              <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium bg-gray-50 align-middle">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium align-middle">
                                {member.firstName} {member.lastName}
                              </td>
                              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, dayIndex) => {
                                const date = dayIndex + 1;
                                // ใช้ข้อมูลจาก cellValues ทั้ง top และ bottom
                                const topShift = cellValues[`${member.id}-${dayIndex}-top`] || '';
                                const bottomShift = cellValues[`${member.id}-${dayIndex}-bottom`] || '';
                                const cellValue = topShift || bottomShift; // แสดงเวรที่อยู่ (ถ้าไม่มีจะแสดงช่องว่าง)
                                const isHolidayDate = holidays.some(h => h.date === date);
                                const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
                                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                                
                                return (
                                  <td 
                                    key={dayIndex} 
                                    className={`border border-gray-300 px-1 py-1 text-center ${
                                      isHolidayDate ? 'bg-orange-50' : 
                                      isWeekend ? 'bg-yellow-50' : ''
                                    }`}
                                  >
                                    <span 
                                      className="text-sm font-medium px-1 py-0.5 rounded"
                                      style={getShiftStyle(cellValue)}
                                    >
                                      {cellValue}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveOverviewImage}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                บันทึกภาพ
              </button>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่มวันหยุด */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">เพิ่มวันหยุด</h3>
              <button
                onClick={() => setShowAddHolidayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกวันที่
                </label>
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {/* วันในสัปดาห์ */}
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* วันที่ในเดือน */}
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                  ))}
                  
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                    const date = i + 1;
                    const isSelected = newHoliday.dates.includes(date);
                    const isHolidayDate = holidays.some(h => h.date === date);
                    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
                    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                    
                    return (
                      <button
                        key={date}
                        onClick={() => toggleDateSelection(date)}
                        disabled={isHolidayDate}
                        className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                          isSelected 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : isHolidayDate
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isWeekend
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={isHolidayDate ? 'วันหยุดนี้มีอยู่แล้ว' : `วันที่ ${date}`}
                      >
                        {date}
                      </button>
                    );
                  })}
                </div>
                
                {newHoliday.dates.length > 0 && (
                  <div className="text-sm text-gray-600">
                    เลือกแล้ว: {newHoliday.dates.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>
              

            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addCustomHoliday}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                เพิ่มวันหยุด
              </button>
              <button
                onClick={() => setShowAddHolidayModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftSchedule;
