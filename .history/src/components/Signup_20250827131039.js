import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const Signup = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'พยาบาล',
    department: 'หอผู้ป่วยศัลยกรรมอุบัติเหตุ'
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

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    try {
      const email = `${formData.username}@hospital.com`;
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        formData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: email,
        role: formData.role,
        department: formData.department,
        createdAt: new Date()
      });

      onSignupSuccess();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      } else if (error.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-dark-blue">
            สมัครสมาชิก
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            สร้างบัญชีใหม่สำหรับระบบจัดการตารางเวร
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="ชื่อ"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  นามสกุล
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="นามสกุล"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                ตำแหน่ง
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="หัวหน้าหน่วยงาน">หัวหน้าหน่วยงาน</option>
                <option value="พยาบาล">พยาบาล</option>
                <option value="ผู้ช่วยพยาบาล">ผู้ช่วยพยาบาล</option>
                <option value="พนักงานผู้ช่วยเหลือคนไข้">พนักงานผู้ช่วยเหลือคนไข้</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                แผนก
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ยืนยันรหัสผ่าน"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              มีบัญชีอยู่แล้ว? เข้าระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
