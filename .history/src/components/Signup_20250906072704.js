import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const Signup = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'พยาบาลวิชาชีพ',
    department: 'หอผู้ป่วยศัลยกรรมอุบัติเหตุ',
    userType: 'User' // User หรือ Admin
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ตรวจสอบรหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    // ตรวจสอบ Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        userType: formData.userType,
        createdAt: new Date()
      });

      onSignupSuccess();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      } else if (error.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      } else {
        setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8" style={{fontFamily: 'Kanit, sans-serif'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#162144" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold" style={{color: '#162144'}}>
              สมัครสมาชิก
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              สร้างบัญชีใหม่สำหรับระบบ SMPK-SA
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="ชื่อ"
                  />
                </div>
                
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
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="กรอกชื่อผู้ใช้"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    ตำแหน่ง
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="พยาบาลวิชาชีพชำนาญการพิเศษ">พยาบาลวิชาชีพชำนาญการพิเศษ</option>
                    <option value="พยาบาลวิชาชีพชำนาญการ">พยาบาลวิชาชีพชำนาญการ</option>
                    <option value="พยาบาลวิชาชีพปฏิบัติการ">พยาบาลวิชาชีพปฏิบัติการ</option>
                    <option value="พยาบาลวิชาชีพ">พยาบาลวิชาชีพ</option>
                    <option value="ผู้ช่วยพยาบาล">ผู้ช่วยพยาบาล</option>
                    <option value="พนักงานผู้ช่วยเหลือคนไข้">พนักงานผู้ช่วยเหลือคนไข้</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทผู้ใช้
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="User">User - เจ้าหน้าที่ทั่วไป</option>
                    <option value="Admin">Admin - หัวหน้าหน่วยงาน</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  แผนก
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="หอผู้ป่วยศัลยกรรมอุบัติเหตุ">หอผู้ป่วยศัลยกรรมอุบัติเหตุ</option>
                  <option value="หอผู้ป่วยกุมารเวชกรรม">หอผู้ป่วยกุมารเวชกรรม</option>
                  <option value="หอผู้ป่วยศัลยกรรมชาย 1">หอผู้ป่วยศัลยกรรมชาย 1</option>
                  <option value="หอผู้ป่วยศัลยกรรมหญิง">หอผู้ป่วยศัลยกรรมหญิง</option>
                  <option value="หอผู้ป่วยศัลยกรรมชาย 2">หอผู้ป่วยศัลยกรรมชาย 2</option>
                  <option value="หอผู้ป่วยศัลยกรรมกระดูกหญิง">หอผู้ป่วยศัลยกรรมกระดูกหญิง</option>
                  <option value="หอผู้ป่วยศัลยกรรมกระดูกชาย">หอผู้ป่วยศัลยกรรมกระดูกชาย</option>
                  <option value="หอผู้ป่วยพิเศษ Premium">หอผู้ป่วยพิเศษ Premium</option>
                  <option value="หอผู้ป่วยโรคติดเชื้อ">หอผู้ป่วยโรคติดเชื้อ</option>
                  <option value="หอผู้ป่วยพิเศษ 5">หอผู้ป่วยพิเศษ 5</option>
                  <option value="หอผู้ป่วยพิเศษ 4">หอผู้ป่วยพิเศษ 4</option>
                  <option value="หอผู้ป่วยกึ่งวิกฤติอายุรกรรม">หอผู้ป่วยกึ่งวิกฤติอายุรกรรม</option>
                  <option value="หอผู้ป่วย ตา หู คอ จมูก">หอผู้ป่วย ตา หู คอ จมูก</option>
                  <option value="ห้องผู้ป่วยหนักอายุรกรรม 2">ห้องผู้ป่วยหนักอายุรกรรม 2</option>
                  <option value="หออภิบาลผู้ป่วยวิกฤติโรคหัวใจ">หออภิบาลผู้ป่วยวิกฤติโรคหัวใจ</option>
                  <option value="พิเศษ VIP">พิเศษ VIP</option>
                  <option value="หอผู้ป่วยอายุกรรมหญิง 1">หอผู้ป่วยอายุกรรมหญิง 1</option>
                  <option value="หอผู้ป่วยอายุกรรมหญิง 2">หอผู้ป่วยอายุกรรมหญิง 2</option>
                  <option value="หอผู้ป่วยนารีเวช">หอผู้ป่วยนารีเวช</option>
                  <option value="หอผู้ป่วยหลังคลอด">หอผู้ป่วยหลังคลอด</option>
                  <option value="หอผู้ป่วยอายุกรรมชาย 1">หอผู้ป่วยอายุกรรมชาย 1</option>
                  <option value="หอผู้ป่วยอายุกรรมชาย 2">หอผู้ป่วยอายุกรรมชาย 2</option>
                  <option value="ห้องผู้ป่วยหนักอายุรกรรม 1">ห้องผู้ป่วยหนักอายุรกรรม 1</option>
                  <option value="ไตเทียม">ไตเทียม</option>
                  <option value="ห้องผู้ป่วยหนักศัลยกรรม 1">ห้องผู้ป่วยหนักศัลยกรรม 1</option>
                  <option value="ห้องผู้ป่วยหนักศัลยกรรม 2">ห้องผู้ป่วยหนักศัลยกรรม 2</option>
                  <option value="NICU">NICU</option>
                  <option value="SNB">SNB</option>
                  <option value="ห้องคลอด">ห้องคลอด</option>
                  <option value="OR">OR</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่าน
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="รหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    ยืนยันรหัสผ่าน
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="ยืนยันรหัสผ่าน"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
              >
                มีบัญชีอยู่แล้ว? เข้าระบบ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
