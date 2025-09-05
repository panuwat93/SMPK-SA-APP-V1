import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const handleInputChange = (section, index, field, value) => {
    if (section === '') {
      setFormData(prev => ({
        ...prev,
        [field]: value
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
        [section]: prev[section].map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }));
    }
  };

  const handleDayChange = (staffIndex, dayIndex, value) => {
    setFormData(prev => ({
      ...prev,
      staff: prev.staff.map((staff, i) => 
        i === staffIndex 
          ? { 
              ...staff, 
              days: staff.days.map((day, j) => j === dayIndex ? value : day)
            }
          : staff
      )
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto print-content" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">แบบฟอร์ม OT-4C</h1>
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
