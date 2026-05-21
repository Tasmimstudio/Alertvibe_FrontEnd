// pages/Registration.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';

const CameraIcon = () => (
  <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function Registration() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const profilePhotoRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Profile photo must be less than 5MB'); return; }
    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) { setError('Full name is required'); return false; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { setError('Valid email is required'); return false; }
    if (!formData.phoneNumber.trim()) { setError('Phone number is required'); return false; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async () => {
      if (!validateForm()) return;
      setLoading(true);
      setError(null);
      try {
        await signup(
          formData.email,
          formData.password,
          formData.fullName,
          formData.phoneNumber
        );

        // Step 2: Upload profile photo (optional, non-critical)
        if (profilePhoto) {
          try { await userApi.uploadProfilePhoto(profilePhoto); }
          catch (e) { console.error('Profile photo upload failed:', e); }
        }

        setTimeout(() => {
          navigate('/');
        }, 1200);
      } catch (err) {
        const msg = err.message || '';
        if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('fetch')) {
          setError('Cannot reach the server. Make sure the backend is running on localhost:4000 and try again.');
        } else {
              switch (err.code) {
  case 'auth/email-already-in-use':
    setError('This email is already registered. Please log in instead.');
    break;

  case 'auth/invalid-email':
    setError('Invalid email address.');
    break;

  case 'auth/weak-password':
    setError('Password is too weak.');
    break;

  default:
    setError(err.message || 'Registration failed. Please try again.');
}
        }
      } finally {
        setLoading(false);
      }
  };

  const handleBack = () => {
    navigate('/login');
  };

  const STEP1_FIELDS = [
    { name: 'fullName', type: 'text', placeholder: 'Full Name', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
    { name: 'email', type: 'email', placeholder: 'Email Address', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    )},
    { name: 'phoneNumber', type: 'tel', placeholder: 'Phone Number', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    )},
    { name: 'password', type: 'password', placeholder: 'Password', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    )},
    { name: 'confirmPassword', type: 'password', placeholder: 'Confirm Password', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    )},
  ];

  return (
    <div className="av-bg av-grid-bg min-h-screen flex items-center justify-center relative overflow-hidden py-8">

      {/* Blobs */}
      <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-15"
           style={{ background: 'radial-gradient(circle,#06b6d4,transparent)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-15"
           style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />

      {/* Card */}
      <div className="glass relative z-10 w-full max-w-md mx-4 sm:mx-6 px-5 sm:px-8 py-7 sm:py-8"
           style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="av-logo" style={{ width: 64, height: 64, borderRadius: '50%' }}>
              <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-base">AlertVibe™</p>
              <p className="text-white/40 text-xs">Create Account — MSU-TCTO</p>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-xs mb-5 font-medium">
          Personal Information
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 font-medium"
               style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}>
            {error}
          </div>
        )}

        <div className="space-y-3">
            {/* Profile photo */}
            <div className="flex justify-center mb-4">
              <div
                onClick={() => profilePhotoRef.current?.click()}
                className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80 overflow-hidden relative"
                style={{ background: 'rgba(255,255,255,0.07)', border: '2px dashed rgba(255,255,255,0.2)' }}
              >
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <CameraIcon />
                    <span className="text-[9px] text-white/40 font-semibold">PHOTO</span>
                  </div>
                )}
              </div>
              <input ref={profilePhotoRef} type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
            </div>

            {STEP1_FIELDS.map(field => (
              <div key={field.name} className="relative">
                {field.icon && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">{field.icon}</span>
                )}
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  className={`av-input ${field.icon ? '!pl-10' : ''}`}
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleBack} disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-1.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(255,255,255,0.85)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Login
          </button>

            <button onClick={handleSubmit} disabled={loading} className="btn-red flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Registering…
                </span>
              ) : 'Complete Registration'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;
