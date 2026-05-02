import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Search, ArrowLeft, GraduationCap, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const getRawBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
  return url.endsWith('/api') ? url.replace('/api', '') : url;
};

const API_BASE_URL = getRawBaseURL();

const AuthPage = () => {
  const [step, setStep] = useState(1); // 1: Login/Register, 2: Select Batch
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState('Al al-Bayt University');
  const [major, setMajor] = useState('IT');
  const [graduationYear, setGraduationYear] = useState('2026');

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    const generatedBatchId = `${university}-${major}-${graduationYear}`.toUpperCase().replace(/\s+/g, '_');
    login({ 
      _id: 'guest_' + Math.random().toString(36).substr(2, 9), 
      fullName: 'زائر - ' + (fullName || 'أحمد'), 
      email: 'guest@' + university.toLowerCase().replace(/\s+/g, '') + '.edu', 
      batchId: generatedBatchId, 
      isGuest: true,
      university,
      major,
      graduationYear
    }, 'mock_token');
    navigate('/home');
  };

  const handleFirstStep = (e) => {
    e.preventDefault();
    if (isLogin) {
      submitAuth();
    } else {
      setStep(2); 
    }
  };

  useEffect(() => {
    if (step !== 3 && step !== 5) return;
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  const handleResend = async () => {
    setTimer(60);
    if (step === 3) await submitAuth();
    else if (step === 5) await handleForgotPassword();
  };

  const submitAuth = async () => {
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email, password }
      : { email, password, fullName, username, university, major, graduationYear: parseInt(graduationYear) };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requireVerification) {
          if (step !== 3) setTimer(60);
          setStep(3);
          console.info('🔑 [DEV] Check backend console for OTP code or use 11111');
        } else {
          login(data, data.token);
          navigate('/home');
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('خطأ في الاتصال بالسيرفر');
    }
  };

  const verifyOtp = async () => {
    try {
      const endpoint = step === 5 ? '/api/auth/reset-password' : '/api/auth/verify-otp';
      const body = step === 5 ? { email, otp, newPassword } : { email, otp };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (step === 5) {
          toast.success('تم تغيير كلمة المرور بنجاح');
          setStep(1); setIsLogin(true);
        } else {
          login(data, data.token);
          navigate('/home');
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network Error');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error('يرجى إدخال البريد الإلكتروني أولاً');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        if (step !== 5) setTimer(60);
        setStep(5);
        toast.success('تم إرسال الرمز بنجاح');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network Error');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--bg-dark)', 
      position: 'relative',
      overflow: 'hidden' 
    }}>
      {/* Background Orbs */}
      <div style={{ 
        position: 'absolute', top: '-10%', left: '-10%', 
        width: '40%', height: '40%', 
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', zIndex: 0 
      }} />
      <div style={{ 
        position: 'absolute', bottom: '-10%', right: '-10%', 
        width: '40%', height: '40%', 
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', zIndex: 0 
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1 }}>

        {step === 1 ? (
          <div style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
            <div className="auth-glass">
              <div className="auth-inner">
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <GraduationCap color="#3B82F6" size={32} />
                  </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontSize: '0.9rem' }}>
                  {isLogin ? 'مرحباً بك مجدداً في منصة دفعتنا' : 'انضم الآن إلى زملائك في دفعة 2026'}
                </p>

                <form onSubmit={handleFirstStep} style={{ width: '100%' }}>
                  {!isLogin && (
                    <>
                      <div className="input-group">
                        <UserIcon className="icon" size={20} />
                        <input className="input-mock" type="text" placeholder="الاسم" value={fullName} onChange={e => setFullName(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <UserIcon className="icon" size={20} />
                        <input className="input-mock" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                    </>
                  )}
                  
                  <div className="input-group">
                    <Mail className="icon" size={20} />
                    <input className="input-mock" type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>

                  <div className="input-group">
                    <Lock className="icon" size={20} />
                    <input className="input-mock" type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                    {isLogin ? 'تسجيل الدخول' : 'متابعة'}
                  </button>

                  {isLogin && (
                    <button type="button" onClick={handleForgotPassword} style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', marginTop: '24px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </form>

                <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                  {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
                  <span 
                    style={{ color: '#3B82F6', cursor: 'pointer', fontWeight: 'bold' }} 
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'سجل الآن' : 'سجل دخولك'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          <div style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
            <div className="auth-glass">
              <div className="auth-inner">
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '32px', cursor: 'pointer' }} onClick={() => setStep(1)}>
                  <ArrowLeft color="rgba(255,255,255,0.6)" size={24} />
                  <span style={{ marginRight: '8px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>العودة</span>
                </div>
                <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '16px' }}>اختر دفعتك</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', textAlign: 'center' }}>اختر الجامعة والتخصص للانضمام إلى شبكة زملائك بأمان.</p>

                <div className="input-group">
                   <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الجامعة</label>
                   <select className="input-mock" value={university} onChange={e => setUniversity(e.target.value)} required>
                      <option value="Al al-Bayt University">جامعة آل البيت</option>
                      <option value="Jordan University">الجامعة الأردنية</option>
                      <option value="Yarmouk University">جامعة اليرموك</option>
                   </select>
                </div>

                <div className="input-group">
                   <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>التخصص</label>
                   <select className="input-mock" value={major} onChange={e => setMajor(e.target.value)} required>
                      <option value="IT">تكنولوجيا المعلومات</option>
                      <option value="Engineering">الهندسة</option>
                      <option value="Medicine">الطب</option>
                      <option value="Business">الاقتصاد والأعمال</option>
                   </select>
                </div>

                <div className="input-group">
                   <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>سنة التخرج</label>
                   <input className="input-mock" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} required />
                </div>

                <button className="btn-primary" style={{ marginTop: '24px' }} onClick={submitAuth}>
                  إكمال التسجيل
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
             <div className="auth-glass">
                <div className="auth-inner">
                   <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
                      {step === 3 ? 'تأكيد الحساب' : 'إعادة تعيين كلمة المرور'}
                   </h1>
                   <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', textAlign: 'center' }}>يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني.</p>
                   
                   <div className="input-group">
                      <input
                        className="input-mock"
                        type="text"
                        placeholder="ر م ز   ا ل ت ح ق ق"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
                        maxLength={6}
                      />
                   </div>

                   {step === 5 && (
                      <div className="input-group">
                         <input className="input-mock" type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                   )}

                   <button className="btn-primary" onClick={verifyOtp}>
                      {step === 5 ? 'تغيير كلمة المرور' : 'تأكيد ودخول'}
                   </button>

                   <div style={{ marginTop: '24px' }}>
                    {timer > 0 ? (
                      <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>إعادة إرسال الرمز خلال {timer} ثانية</p>
                    ) : (
                      <button onClick={handleResend} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 'bold' }}>إعادة إرسال الرمز</button>
                    )}
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
