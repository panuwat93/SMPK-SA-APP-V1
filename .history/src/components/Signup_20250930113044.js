import React, { useState } from 'react';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const Signup = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'พยาบาลวิชาชีพ',
    department: 'หอผู้ป่วยศัลยกรรมอุบัติเหตุ',
    userType: 'User' // User หรือ Admin
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // ตรวจสอบ Username Format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('ชื่อผู้ใช้ต้องมี 3-20 ตัวอักษร และใช้ได้เฉพาะตัวอักษร ตัวเลข และ _');
      setLoading(false);
      return;
    }

    // ตรวจสอบว่า Username ซ้ำหรือไม่
    const usernameQuery = await getDocs(query(collection(db, 'users'), where('username', '==', formData.username)));
    if (!usernameQuery.empty) {
      setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาใช้ชื่ออื่น');
      setLoading(false);
      return;
    }

    try {
      // สร้าง email จำลองจาก username
      const mockEmail = `${formData.username}@smpk-sa.local`;
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        mockEmail, 
        formData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        role: formData.role,
        department: formData.department,
        userType: 'User',
        createdAt: new Date()
      });

      onSignupSuccess();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาใช้ชื่ออื่น');
      } else if (error.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else if (error.code === 'auth/invalid-email') {
        setError('ชื่อผู้ใช้ไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + error.message);
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
                  <div className="w-full px-4 py-3 bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700">
                    User - เจ้าหน้าที่ทั่วไป
                  </div>
                  <input type="hidden" id="userType" name="userType" value="User" />
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
                  <option value="กายภาพ">กายภาพ</option>
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
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="ยืนยันรหัสผ่าน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
