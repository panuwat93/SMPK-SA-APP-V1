import React, { useState, useEffect } from 'react';

const LandscapeToggle = () => {
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);

  // ตรวจสอบว่าอยู่ใน mobile หรือไม่
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  useEffect(() => {
    // เพิ่ม CSS class เมื่อเปิด landscape mode
    if (isLandscapeMode) {
      document.body.classList.add('force-landscape-mode');
    } else {
      document.body.classList.remove('force-landscape-mode');
    }

    // Cleanup เมื่อ component unmount
    return () => {
      document.body.classList.remove('force-landscape-mode');
    };
  }, [isLandscapeMode]);

  // แสดงปุ่มเฉพาะใน mobile
  if (!isMobile()) {
    return null;
  }

  return (
    <>
      {/* CSS สำหรับ force landscape mode */}
      <style>{`
        /* Force Landscape Mode */
        body.force-landscape-mode .dashboard-container,
        body.force-landscape-mode .assignments-container,
        body.force-landscape-mode .schedule-container,
        body.force-landscape-mode .exchange-container {
          padding: 8px !important;
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
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
          title={isLandscapeMode ? 'ปิดโหมดแนวนอน' : 'เปิดโหมดแนวนอน'}
        >
          {isLandscapeMode ? (
            // ไอคอนแนวตั้ง (Portrait)
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="7" y="3" width="10" height="18" rx="1" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 7h2M11 17h2" />
            </svg>
          ) : (
            // ไอคอนแนวนอน (Landscape)
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="10" rx="1" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11v2M17 11v2" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default LandscapeToggle;
