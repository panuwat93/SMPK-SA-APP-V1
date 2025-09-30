import React, { useState, useEffect } from 'react';

const LandscapeToggle = () => {
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);

  // ตรวจสอบว่าอยู่ใน mobile หรือไม่ (รองรับหน้าจอใหญ่ เช่น S24 Ultra)
  const isMobile = () => {
    // ตรวจสอบ user agent ก่อน
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // หรือตรวจสอบ touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // หรือตรวจสอบขนาดหน้าจอ (เพิ่มขึ้นเป็น 1024px สำหรับ tablet และโทรศัพท์ขนาดใหญ่)
    const isSmallScreen = window.innerWidth <= 1024;
    
    return isMobileDevice || (isTouchDevice && isSmallScreen);
  };

  useEffect(() => {
    // เพิ่ม CSS class เมื่อเปิด landscape mode
    if (isLandscapeMode) {
      document.body.classList.add('force-landscape-mode');
      // บังคับให้หน้าจอหมุนเป็นแนวนอน
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(err => {
          console.log('ไม่สามารถล็อคหน้าจอได้:', err);
        });
      }
    } else {
      document.body.classList.remove('force-landscape-mode');
      // ปลดล็อคหน้าจอ
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
    }

    // Cleanup เมื่อ component unmount
    return () => {
      document.body.classList.remove('force-landscape-mode');
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
    };
  }, [isLandscapeMode]);

  // สำหรับ debug - ตรวจสอบใน console
  useEffect(() => {
    console.log('LandscapeToggle Debug:', {
      userAgent: navigator.userAgent,
      isMobileDevice: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenWidth: window.innerWidth,
      shouldShowButton: isMobile()
    });
  }, []);

  // แสดงปุ่มเฉพาะใน mobile (หรือ debug mode)
  const isDebugMode = false; // เปลี่ยนเป็น true เพื่อแสดงปุ่มเสมอ
  
  if (!isMobile() && !isDebugMode) {
    return null;
  }

  return (
    <>
      {/* CSS สำหรับ force landscape mode */}
      <style>{`
        /* Force Landscape Mode - รองรับหน้าจอใหญ่เช่น S24 Ultra */
        body.force-landscape-mode .dashboard-container,
        body.force-landscape-mode .assignments-container,
        body.force-landscape-mode .schedule-container,
        body.force-landscape-mode .exchange-container {
          padding: 8px !important;
        }
        
        /* ตารางเวร - Force Landscape Mode */
        body.force-landscape-mode .schedule-header h1 {
          font-size: 1.125rem !important;
          margin-bottom: 8px !important;
        }
        
        body.force-landscape-mode .schedule-header p {
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .schedule-view-selector {
          font-size: 0.75rem !important;
          gap: 8px !important;
        }
        
        body.force-landscape-mode .schedule-view-selector select {
          font-size: 0.75rem !important;
          padding: 4px 8px !important;
        }
        
        body.force-landscape-mode .dashboard-header,
        body.force-landscape-mode .assignments-header,
        body.force-landscape-mode .schedule-header,
        body.force-landscape-mode .exchange-header {
          padding: 12px !important;
          margin-bottom: 16px !important;
        }
        
        body.force-landscape-mode .dashboard-header h1,
        body.force-landscape-mode .assignments-header h1,
        body.force-landscape-mode .schedule-header h1,
        body.force-landscape-mode .exchange-header h1 {
          font-size: 1.25rem !important;
          margin-bottom: 8px !important;
        }
        
        body.force-landscape-mode .dashboard-header p,
        body.force-landscape-mode .exchange-header p {
          font-size: 0.875rem !important;
        }
        
        body.force-landscape-mode .dashboard-logo {
          width: 40px !important;
          height: 40px !important;
          margin-bottom: 12px !important;
        }
        
        body.force-landscape-mode .dashboard-admin-badge {
          padding: 4px 8px !important;
          font-size: 0.75rem !important;
        }
        
        /* Calendar */
        body.force-landscape-mode .calendar-container {
          padding: 12px !important;
          margin-bottom: 12px !important;
        }
        
        body.force-landscape-mode .calendar-header {
          margin-bottom: 8px !important;
        }
        
        body.force-landscape-mode .calendar-header h2 {
          font-size: 1rem !important;
        }
        
        body.force-landscape-mode .calendar-nav-button {
          padding: 4px !important;
        }
        
        body.force-landscape-mode .calendar-nav-text {
          font-size: 0.875rem !important;
        }
        
        body.force-landscape-mode .calendar-table th,
        body.force-landscape-mode .calendar-table td {
          padding: 2px !important;
          height: 48px !important;
          width: 48px !important;
        }
        
        body.force-landscape-mode .calendar-date {
          font-size: 0.625rem !important;
          margin-bottom: 2px !important;
        }
        
        body.force-landscape-mode .calendar-shift {
          font-size: 0.625rem !important;
          padding: 1px 2px !important;
          margin-bottom: 1px !important;
        }
        
        body.force-landscape-mode .admin-calendar .calendar-table th,
        body.force-landscape-mode .admin-calendar .calendar-table td {
          height: 32px !important;
          width: 32px !important;
        }
        
        /* Schedule */
        body.force-landscape-mode .schedule-buttons button {
          padding: 4px 8px !important;
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .schedule-month-nav button {
          padding: 6px !important;
        }
        
        body.force-landscape-mode .schedule-month-nav span {
          font-size: 0.875rem !important;
        }
        
        body.force-landscape-mode .schedule-table {
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .schedule-table th,
        body.force-landscape-mode .schedule-table td {
          padding: 4px 6px !important;
          min-width: 40px !important;
          font-size: 0.625rem !important;
        }
        
        body.force-landscape-mode .schedule-table {
          font-size: 0.625rem !important;
        }
        
        body.force-landscape-mode .schedule-table input,
        body.force-landscape-mode .schedule-table select {
          font-size: 0.625rem !important;
          padding: 2px 4px !important;
          min-height: 24px !important;
        }
        
        /* เพิ่มการจัดการตารางเวรเฉพาะ */
        body.force-landscape-mode .schedule-table {
          transform: scale(0.8) !important;
          transform-origin: top left !important;
          width: 125% !important;
        }
        
        body.force-landscape-mode .max-h-\\[400px\\] {
          max-height: 320px !important;
        }
        
        body.force-landscape-mode .schedule-toolbar {
          padding: 8px 12px !important;
          gap: 8px !important;
        }
        
        body.force-landscape-mode .schedule-toolbar button {
          padding: 4px 6px !important;
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .view-mode-buttons {
          gap: 4px !important;
        }
        
        body.force-landscape-mode .view-mode-buttons button {
          padding: 4px 8px !important;
          font-size: 0.75rem !important;
        }
        
        /* Assignments */
        body.force-landscape-mode .assignments-table {
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .assignments-table th,
        body.force-landscape-mode .assignments-table td {
          padding: 6px 8px !important;
        }
        
        body.force-landscape-mode .assignments-table select {
          padding: 4px 6px !important;
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .shift-tabs {
          gap: 4px !important;
        }
        
        body.force-landscape-mode .shift-tab {
          padding: 4px 8px !important;
          font-size: 0.75rem !important;
        }
        
        body.force-landscape-mode .table-section {
          margin-bottom: 16px !important;
        }
        
        body.force-landscape-mode .section-header {
          padding: 8px 12px !important;
          font-size: 0.875rem !important;
        }
        
        /* Exchange */
        body.force-landscape-mode .exchange-card {
          padding: 12px !important;
          margin-bottom: 12px !important;
        }
        
        body.force-landscape-mode .exchange-form-grid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        
        body.force-landscape-mode .exchange-shift-box {
          padding: 8px !important;
        }
        
        body.force-landscape-mode .exchange-shift-box h4 {
          font-size: 0.875rem !important;
          margin-bottom: 8px !important;
        }
        
        body.force-landscape-mode .exchange-button {
          padding: 8px 16px !important;
          font-size: 0.875rem !important;
        }
        
        body.force-landscape-mode .exchange-back-button {
          padding: 6px 12px !important;
          font-size: 0.75rem !important;
        }
      `}</style>

      {/* ปุ่มลอย */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsLandscapeMode(!isLandscapeMode)}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110
            ${isLandscapeMode 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
          title={isLandscapeMode ? 'ปิดโหมดแนวนอน' : 'เปิดโหมดแนวนอน'}
        >
          {isLandscapeMode ? (
            // ไอคอนแนวตั้ง - มือถือยืน (ชัดเจน)
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z"/>
            </svg>
          ) : (
            // ไอคอนแนวนอน - มือถือนอน (ชัดเจน)
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2zm16 8H7V9h10v6zm2-5v4h1V10h-1z"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default LandscapeToggle;
