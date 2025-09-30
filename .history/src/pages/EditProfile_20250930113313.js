import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditProfile = ({ userData, refreshUserData }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData?.uid) {
      loadUserData();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const userRef = doc(db, 'users', userData.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          department: data.department || '',
          role: data.role || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaved(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('กรุณากรอกชื่อและนามสกุล');
      return;
    }
    
    if (!formData.department || !formData.role) {
      setError('กรุณาเลือกแผนกและตำแหน่ง');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        department: formData.department,
        role: formData.role,
        updatedAt: new Date()
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh ข้อมูลผู้ใช้ใน AuthWrapper
      if (refreshUserData) {
        refreshUserData();
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const departmentOptions = [
    'กายภาพ',
    'หอผู้ป่วยศัลยกรรมอุบัติเหตุ',
    'หอผู้ป่วยกุมารเวชกรรม',
    'หอผู้ป่วยศัลยกรรมชาย 1',
    'หอผู้ป่วยศัลยกรรมหญิง',
    'หอผู้ป่วยศัลยกรรมชาย 2',
    'หอผู้ป่วยศัลยกรรมกระดูกหญิง',
    'หอผู้ป่วยศัลยกรรมกระดูกชาย',
    'หอผู้ป่วยพิเศษ Premium',
    'หอผู้ป่วยโรคติดเชื้อ',
    'หอผู้ป่วยพิเศษ 5',
    'หอผู้ป่วยพิเศษ 4',
    'หอผู้ป่วยกึ่งวิกฤติอายุรกรรม',
    'หอผู้ป่วย ตา หู คอ จมูก',
    'ห้องผู้ป่วยหนักอายุรกรรม 2',
    'หออภิบาลผู้ป่วยวิกฤติโรคหัวใจ',
    'พิเศษ VIP',
    'หอผู้ป่วยอายุกรรมหญิง 1',
    'หอผู้ป่วยอายุกรรมหญิง 2',
    'หอผู้ป่วยนารีเวช'
  ];

  const roleOptions = [
    'พยาบาลวิชาชีพชำนาญการพิเศษ',
    'พยาบาลวิชาชีพชำนาญการ',
    'พยาบาลวิชาชีพปฏิบัติการ',
    'พยาบาลวิชาชีพ',
    'ผู้ช่วยพยาบาล',
    'พนักงานผู้ช่วยเหลือคนไข้'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">แก้ไขข้อมูลส่วนตัว</h1>
        </div>

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ชื่อ */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="กรอกชื่อ"
              />
            </div>

            {/* นามสกุล */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="กรอกนามสกุล"
              />
            </div>

            {/* แผนก */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                แผนก
              </label>
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">เลือกแผนก</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* ตำแหน่ง */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                ตำแหน่ง
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">เลือกตำแหน่ง</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* อีเมล (แสดงอย่างเดียว) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                {userData?.email || 'ไม่พบข้อมูลอีเมล'}
              </div>
              <p className="text-xs text-gray-500 mt-1">ไม่สามารถแก้ไขอีเมลได้</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : saved
                    ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                }`}
              >
                {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
