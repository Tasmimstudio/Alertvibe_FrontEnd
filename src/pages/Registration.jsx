// pages/Registration.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motorcycleApi, userApi } from '../services/api';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
    plateNumber: '', motorcycleModel: '', color: '', deviceCode: '', department: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [motorcyclePhoto, setMotorcyclePhoto] = useState(null);
  const [motorcyclePhotoPreview, setMotorcyclePhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const profilePhotoRef = useRef(null);
  const motorcyclePhotoRef = useRef(null);

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

  const handleMotorcyclePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Motorcycle photo must be less than 5MB'); return; }
    setMotorcyclePhoto(file);
    setMotorcyclePhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) { setError('Full name is required'); return false; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { setError('Valid email is required'); return false; }
    if (!formData.phoneNumber.trim()) { setError('Phone number is required'); return false; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.plateNumber.trim()) { setError('Plate number is required'); return false; }
    if (!formData.motorcycleModel.trim()) { setError('Motorcycle model is required'); return false; }
    if (!formData.color.trim()) { setError('Color is required'); return false; }
    if (!formData.deviceCode.trim()) { setError('Device code is required'); return false; }
    if (!formData.department.trim()) { setError('Department is required'); return false; }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      setError(null);
    } else {
      if (!validateStep2()) return;
      setLoading(true);
      setError(null);
      try {
        // Step 1: Create Firebase account (always required)
        const userResult = await signup(formData.email, formData.password, formData.fullName);

        // Step 2: Upload profile photo (optional, non-critical)
        if (profilePhoto) {
          try { await userApi.uploadProfilePhoto(profilePhoto); }
          catch (e) { console.error('Profile photo upload failed:', e); }
        }

        // Step 3: Register motorcycle in backend
        try {
          const motorcycleResult = await motorcycleApi.register({
            plateNumber: formData.plateNumber, model: formData.motorcycleModel,
            color: formData.color, deviceCode: formData.deviceCode, department: formData.department,
            ownerId: userResult.user.uid, ownerName: formData.fullName,
          });
          if (motorcyclePhoto && motorcycleResult.motorcycle?.id) {
            try { await motorcycleApi.uploadPhoto(motorcycleResult.motorcycle.id, motorcyclePhoto); }
            catch (e) { console.error('Motorcycle photo upload failed:', e); }
          }
        } catch (backendErr) {
          const msg = backendErr.message || '';
          if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('fetch')) {
            // Account created but backend is offline — send to dashboard anyway
            setError('Account created! However, the backend server is offline. Start the backend server and add your motorcycle from the dashboard.');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
          throw backendErr;
        }

        navigate('/');
      } catch (err) {
        const msg = err.message || '';
        if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('fetch')) {
          setError('Cannot reach the server. Make sure the backend is running on localhost:4000 and try again.');
        } else {
          setError(msg || 'Registration failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) { setCurrentStep(1); setError(null); }
    else navigate('/login');
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

  const STEP2_FIELDS = [
    { name: 'plateNumber', type: 'text', placeholder: 'Plate Number' },
    { name: 'motorcycleModel', type: 'text', placeholder: 'Motorcycle Model' },
    { name: 'color', type: 'text', placeholder: 'Color' },
    { name: 'deviceCode', type: 'text', placeholder: 'Device Code' },
    { name: 'department', type: 'text', placeholder: 'Department' },
  ];

  return (
    <div className="av-bg av-grid-bg min-h-screen flex items-center justify-center relative overflow-hidden py-8">

      {/* Blobs */}
      <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle,#dc2626,transparent)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle,#0891b2,transparent)' }} />

      {/* Card */}
      <div className="glass relative z-10 w-full max-w-md mx-6 px-8 py-8"
           style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="av-logo" style={{ width: 44, height: 44, borderRadius: 12 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
                <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-black tracking-widest text-base">ALERTVIBE</h1>
              <p className="text-white/40 text-xs">Create Account</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                     style={{
                       background: s === currentStep ? 'linear-gradient(135deg,#ef4444,#dc2626)' : s < currentStep ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                       color: s <= currentStep ? '#fff' : 'rgba(255,255,255,0.4)',
                       boxShadow: s === currentStep ? '0 2px 8px rgba(220,38,38,0.4)' : 'none',
                     }}>
                  {s < currentStep ? '✓' : s}
                </div>
                {s === 1 && <div className="w-6 h-px" style={{ background: currentStep > 1 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step labels */}
        <p className="text-white/50 text-xs mb-5 font-medium">
          Step {currentStep} of 2 — {currentStep === 1 ? 'Personal Information' : 'Motorcycle Details'}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 font-medium"
               style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}>
            {error}
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
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
                  className={`av-input ${field.icon ? 'pl-10' : ''}`}
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-3">
            {/* Motorcycle photo */}
            <div className="flex justify-center mb-4">
              <div
                onClick={() => motorcyclePhotoRef.current?.click()}
                className="w-32 h-20 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)', border: '2px dashed rgba(255,255,255,0.2)' }}
              >
                {motorcyclePhotoPreview ? (
                  <img src={motorcyclePhotoPreview} alt="Motorcycle" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <CameraIcon />
                    <span className="text-[9px] text-white/40 font-semibold">MOTORCYCLE PHOTO</span>
                  </div>
                )}
              </div>
              <input ref={motorcyclePhotoRef} type="file" accept="image/*" onChange={handleMotorcyclePhotoChange} className="hidden" />
            </div>

            {STEP2_FIELDS.map(field => (
              <input
                key={field.name}
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                className="av-input"
                placeholder={field.placeholder}
                required
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleBack} disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white/60 transition-all hover:text-white disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {currentStep === 1 ? '← Back to Login' : '← Back'}
          </button>

          {currentStep === 1 ? (
            <button onClick={handleNext} disabled={loading} className="btn-cyan flex-1 py-3">
              Next →
            </button>
          ) : (
            <button onClick={handleNext} disabled={loading} className="btn-red flex-1 py-3">
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Registration;
