import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OT3A = ({ userData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orderNumber: '',
    orderDate: '',
    month: '',
    department: userData?.department || '',
    staff: Array(8).fill().map(() => ({
      no: '',
      name: '',
      position: '',
      days: Array(31).fill(''),
      remarks: ''
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
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatDateToThai = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    return `${day}/${month}/${year}`;
  };

  const parseThaiDate = (thaiDateString) => {
    if (!thaiDateString) return '';
    const parts = thaiDateString.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const buddhistYear = parseInt(parts[2]);
      const christianYear = buddhistYear - 543;
      return `${christianYear}-${month}-${day}`;
    }
    return '';
  };

  const handleDateInput = (value) => {
    // Remove non-numeric characters except /
    let cleanValue = value.replace(/[^\d/]/g, '');
    
    // Auto-format as user types
    if (cleanValue.length <= 2) {
      // Just day
      return cleanValue;
    } else if (cleanValue.length <= 5) {
      // Day/month
      if (cleanValue.length === 3 && !cleanValue.includes('/')) {
        cleanValue = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
      }
      return cleanValue;
    } else if (cleanValue.length <= 10) {
      // Day/month/year
      if (cleanValue.length === 6 && cleanValue.split('/').length === 2) {
        cleanValue = cleanValue + '/';
      }
      return cleanValue;
    }
    
    return cleanValue.substring(0, 10); // Limit to dd/mm/yyyy format
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">แบบฟอร์ม OT-3A</h1>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-300 p-6">
          {/* Document Header */}
          <div className="mb-4 text-center">
            <p className="text-sm">
              เอกสารแนบคำสั่งโรงพยาบาลสมุทรปราการ ที่
              <input 
                type="text" 
                className="border-b border-gray-400 mx-2 w-32 text-center"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('', '', 'orderNumber', e.target.value)}
              />
              ลงวันที่
              <input 
                type="text" 
                className="border-b border-gray-400 mx-2 w-32"
                placeholder="dd/mm/yyyy"
                value={formData.orderDate}
                onChange={(e) => handleInputChange('', '', 'orderDate', e.target.value)}
              />
            </p>
          </div>

          {/* Title */}
          <div className="mb-6 relative">
            <div className="text-center">
              <p className="text-sm">
                ตารางปฏิบัติงานประจำ เดือน
                <select 
                  className="border-b border-gray-400 mx-2 w-20 text-center bg-transparent"
                  value={formData.month}
                  onChange={(e) => handleInputChange('', '', 'month', e.target.value)}
                >
                  <option value="">เลือก</option>
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
                ชื่อหน่วยงาน
                <span className="mx-2 font-medium">{formData.department}</span>
              </p>
            </div>
            <div className="absolute top-0 right-0">
              <p className="text-sm font-bold">แบบฟอร์ม OT - 3A</p>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                            <th className="border border-gray-400 p-1 w-8">ลำดับ</th>
          <th className="border border-gray-400 p-1 w-40">ชื่อ - สกุล</th>
          <th className="border border-gray-400 p-1 w-40">ตำแหน่ง</th>
          <th className="border border-gray-400 p-1 text-center" colSpan="31">วันที่ปฏิบัติงาน</th>
          <th className="border border-gray-400 p-1 w-16">หมายเหตุ</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  {/* Days 1-31 */}
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} className="border border-gray-400 p-1 w-8 text-center">
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-gray-400 p-1"></th>
                </tr>
              </thead>
              <tbody>
                {formData.staff.map((staff, staffIndex) => (
                  <tr key={staffIndex}>
                    <td className="border border-gray-400 p-1 w-8">
                      <input 
                        type="text" 
                        className="w-full text-center border-none outline-none"
                        value={staff.no}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'no', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1 w-40">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.name}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'name', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1 w-40">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.position}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'position', e.target.value)}
                      />
                    </td>
                    {/* Days 1-31 */}
                    {staff.days.map((day, dayIndex) => (
                      <td key={dayIndex} className="border border-gray-400 p-1 w-8">
                        <input 
                          type="text" 
                          className="w-full text-center border-none outline-none"
                          value={day}
                          onChange={(e) => handleDayChange(staffIndex, dayIndex, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="border border-gray-400 p-1 w-16">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none"
                        value={staff.remarks}
                        onChange={(e) => handleInputChange('staff', staffIndex, 'remarks', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <h3 className="font-bold text-sm mb-2">หมายเหตุ</h3>
            <div className="text-xs space-y-2">
              <p>
                1. ขออนุมัติเจ้าหน้าที่ขึ้นปฏิบัติงานผลัดละ 8 ชม. ดังนี้ : ช = เวรเช้า 08.00 - 16.00 น. บ = เวรบ่าย 16.00 - 24.00 น. ด = เวรดึก 24.00 - 08.00 น.
              </p>
              <p className="ml-4">
                ใช้สีน้ำเงินแสดงการจัดเวรปฏิบัติงานปกติ สีแดง แสดงการจัดเวรปฏิบัติงานนอกเวลาราชการและวันหยุดโดยเบิกค่าตอบแทนตามระเบียบฯ
              </p>
              <p className="ml-4">
                ในกรณีที่ใช้วันหยุดของตนไปขึ้นเวรที่อื่นให้ใช้สัญลักษณ์ [ช] [บ] [ด] สีแดง และระบุรายละเอียดในช่องหมายเหตุ กรณีใช้สีหรือสัญลักษณ์ที่แตกต่างจากนี้ให้ระบุรายละเอียดในช่องหมายเหตุ
              </p>
              <p>
                2. กรณีออกไปปฏิบัติงานนอกสถานที่ หรือการปฏิบัติงานในคลีนิกพิเศษนอกเวลา หรือปฏิบัติงานไม่ถึง 8 ชม. ให้ลงตัวเลขเป็นจำนวนชั่วโมงแต่ละวันที่ปฏิบัติงานและระบุเวลาในช่องหมายเหตุ
              </p>
              <p>
                3. การปฏิบัติงานนอกเวลาราชการ โดยเบิกจ่ายค่าตอบแทนตามระเบียบฯ เงินบำรุง ต้องจัดทำเป็นคำสั่งและแนบตารางเวรนี้ไปด้วยทุกครั้ง
              </p>
              <p>
                4. ให้จัดเจ้าหน้าที่ทุกประเภท ข้าราชการและลูกจ้าง ลงในตารางเวรเดียวกัน โดยใช้คำสั่งเดียว
              </p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-8 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ผู้ขออนุมัติ</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ตำแหน่ง</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">วันที่</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ลงชื่อหัวหน้าผู้ควบคุม</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ตำแหน่ง</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">วันที่</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ผู้จัดตารางปฏิบัติงาน</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">ตำแหน่ง</p>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs">วันที่</p>
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

export default OT3A;
