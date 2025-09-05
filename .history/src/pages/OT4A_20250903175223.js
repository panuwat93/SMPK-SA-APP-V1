import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OT4A = ({ userData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    department: userData?.department || '',
    month: '',
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

  const handleInputChange = (section, index, field, value) => {
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
    }
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto print-content" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">แบบฟอร์ม OT-4A</h1>
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
                <span className="border-b border-gray-400 mx-2 w-40 inline-block h-5"></span>
                <span className="mr-2">ประจำเดือน</span>
                <span className="border-b border-gray-400 mx-2 w-20 inline-block h-5"></span>
              </div>
            </div>
            <div className="absolute top-0 right-0">
              <p className="text-sm font-bold">แบบฟอร์ม OT - 4A</p>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1 w-12">ลำดับ</th>
                  <th className="border border-gray-400 p-1 w-32">ชื่อ</th>
                  <th className="border border-gray-400 p-1 w-24">อัตราค่าจ้าง/ค่าตอบแทน</th>
                  <th className="border border-gray-400 p-1 text-center" colSpan="31">วันที่ปฏิบัติงาน(21-20)</th>
                  <th className="border border-gray-400 p-1 w-20">รวมวัน/ชม.ปฏิบัติงาน</th>
                  <th className="border border-gray-400 p-1 w-24">รวมเงิน</th>
                  <th className="border border-gray-400 p-1 w-24">ลายมือชื่อผู้ปฏิบัติงานจริง</th>
                  <th className="border border-gray-400 p-1 w-24">ลายมือชื่อผู้รับเงิน</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  {/* Days 21-31 (previous month) */}
                  {Array.from({ length: 11 }, (_, i) => (
                    <th key={i} className="border border-gray-400 p-1 w-8 text-center">
                      {i + 21}
                    </th>
                  ))}
                  {/* Days 1-20 (current month) */}
                  {Array.from({ length: 20 }, (_, i) => (
                    <th key={i + 11} className="border border-gray-400 p-1 w-8 text-center">
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                </tr>
              </thead>
              <tbody>
                {formData.staff.map((staff, staffIndex) => (
                  <tr key={staffIndex}>
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full text-center border-none outline-none"
                        value={staff.no}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'no', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.name}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'name', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.rate}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'rate', e.target.value)}
                      />
                    </td>
                    {/* Days 21-31 (previous month) */}
                    {staff.days.slice(20, 31).map((day, dayIndex) => (
                      <td key={dayIndex} className="border border-gray-400 p-1">
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
                      <td key={dayIndex + 11} className="border border-gray-400 p-1">
                        <input 
                          type="text" 
                          className="w-full text-center border-none outline-none"
                          value={day}
                          onChange={(e) => handleDayChange(staffIndex, dayIndex, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full text-center border-none outline-none"
                        value={staff.totalDays}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'totalDays', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full text-center border-none outline-none"
                        value={staff.totalAmount}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'totalAmount', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.performerSignature}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'performerSignature', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
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
             <div>
               <p className="text-xs mb-4">ขอรับรองว่า ผู้มีรายชื่อข้างต้นปฏิบัติงานจริงตามที่เบิกจริง</p>
               
               <div className="space-y-4">
                 <div>
                   <p className="text-xs">ลงชื่อ....................................หัวหน้าผู้ควบคุม</p>
                   <p className="text-xs">(............................................)</p>
                   <p className="text-xs">ตำแหน่ง..................................</p>
                   <p className="text-xs">ตรวจสอบถูกต้อง</p>
                 </div>
                 
                 <div>
                   <p className="text-xs">ลงชื่อ.................................ผู้ขออนุมัติ</p>
                   <p className="text-xs">(.............................................)</p>
                   <p className="text-xs">ตำแหน่ง......................................</p>
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
