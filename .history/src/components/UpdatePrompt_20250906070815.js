import React, { useState, useEffect } from 'react';

const UpdatePrompt = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // ตรวจสอบ Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // ตรวจสอบการอัปเดต Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // มี Service Worker ใหม่พร้อมใช้งาน
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        });

        // ตรวจสอบ waiting worker ที่มีอยู่แล้ว
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }
      });

      // ฟังการเปลี่ยนแปลง Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">มีเวอร์ชันใหม่พร้อมใช้งาน</h4>
            <p className="text-sm text-blue-100">กดอัปเดตเพื่อใช้ฟีเจอร์ล่าสุด</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm bg-blue-700 hover:bg-blue-800 rounded transition-colors"
          >
            ภายหลัง
          </button>
          <button
            onClick={handleUpdate}
            className="px-3 py-1 text-sm bg-white text-blue-600 hover:bg-gray-100 rounded font-medium transition-colors"
          >
            อัปเดตเลย
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
