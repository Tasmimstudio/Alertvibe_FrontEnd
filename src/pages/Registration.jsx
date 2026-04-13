// pages/Registration.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motorcycleApi, userApi } from '../services/api';

function Registration() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 fields
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    // Step 2 fields
    plateNumber: '',
    motorcycleModel: '',
    color: '',
    deviceCode: '',
    department: '',
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile photo must be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleMotorcyclePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Motorcycle photo must be less than 5MB');
        return;
      }
      setMotorcyclePhoto(file);
      setMotorcyclePhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.plateNumber.trim()) {
      setError('Plate number is required');
      return false;
    }
    if (!formData.motorcycleModel.trim()) {
      setError('Motorcycle model is required');
      return false;
    }
    if (!formData.color.trim()) {
      setError('Color is required');
      return false;
    }
    if (!formData.deviceCode.trim()) {
      setError('Device code is required');
      return false;
    }
    if (!formData.department.trim()) {
      setError('Department is required');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
      // Move to step 2
      setCurrentStep(2);
      setError(null);
    } else {
      // Step 2 - Complete registration
      if (!validateStep2()) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Create user account
        const userResult = await signup(formData.email, formData.password, formData.fullName);

        // Upload profile photo if selected
        if (profilePhoto) {
          try {
            await userApi.uploadProfilePhoto(profilePhoto);
          } catch (photoErr) {
            console.error('Profile photo upload failed:', photoErr);
          }
        }

        // Save motorcycle details to database
        const motorcycleResult = await motorcycleApi.register({
          plateNumber: formData.plateNumber,
          model: formData.motorcycleModel,
          color: formData.color,
          deviceCode: formData.deviceCode,
          department: formData.department,
          ownerId: userResult.user.uid,
          ownerName: formData.fullName,
        });

        // Upload motorcycle photo if selected
        if (motorcyclePhoto && motorcycleResult.motorcycle?.id) {
          try {
            await motorcycleApi.uploadPhoto(motorcycleResult.motorcycle.id, motorcyclePhoto);
          } catch (photoErr) {
            console.error('Motorcycle photo upload failed:', photoErr);
          }
        }

        // Navigate to dashboard
        navigate('/');
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      // Go back to step 1
      setCurrentStep(1);
      setError(null);
    } else {
      // Go back to login
      navigate('/login');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      {/* Header with Logo and Next Button */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-xl">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                A<span className="text-gray-700">/</span>V
              </div>
              <div className="text-[8px] font-semibold text-yellow-600 mt-0.5">
                ALERT VIBE
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-wide">ALERTVIBE</h2>
            <p className="text-red-500 font-bold text-sm tracking-wider">SIGN N PLAY</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentStep === 2 && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 rounded font-bold text-black transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: '#fbbf24',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              {loading ? 'Processing...' : 'REGISTER'}
            </button>
          )}
          <button
            onClick={currentStep === 1 ? handleNext : handleBack}
            disabled={loading}
            className="px-6 py-2 rounded font-bold text-black transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: '#06b6d4',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            }}
          >
            {currentStep === 1 ? 'NEXT >>' : '<< BACK'}
          </button>
        </div>
      </div>

      {/* Back Arrow */}
      <button
        onClick={handleBack}
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 hover:scale-110 transition-transform"
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Registration Form */}
      <div className="relative z-10 w-full max-w-xl px-6 mt-20">
        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {currentStep === 1 ? (
            <>
              {/* Profile Photo Picker */}
              <div className="flex justify-center mb-2">
                <div
                  onClick={() => profilePhotoRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all overflow-hidden"
                >
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[10px] text-white/70">PHOTO</span>
                    </div>
                  )}
                </div>
                <input
                  ref={profilePhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </div>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="FULL NAME"
                required
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="EMAIL"
                required
              />

              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="PHONE NUMBER"
                required
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="PASSWORD"
                required
              />

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="RE ENTER PASSWORD"
                required
              />
            </>
          ) : (
            <>
              {/* Motorcycle Photo Picker */}
              <div className="flex justify-center mb-2">
                <div
                  onClick={() => motorcyclePhotoRef.current?.click()}
                  className="w-32 h-24 rounded-lg bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all overflow-hidden"
                >
                  {motorcyclePhotoPreview ? (
                    <img src={motorcyclePhotoPreview} alt="Motorcycle" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[10px] text-white/70">MOTORCYCLE PHOTO</span>
                    </div>
                  )}
                </div>
                <input
                  ref={motorcyclePhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMotorcyclePhotoChange}
                  className="hidden"
                />
              </div>

              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="PLATE NUMBER"
                required
              />

              <input
                type="text"
                name="motorcycleModel"
                value={formData.motorcycleModel}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="MOTORCYCLE MODEL"
                required
              />

              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="COLOR"
                required
              />

              <input
                type="text"
                name="deviceCode"
                value={formData.deviceCode}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="DEVICE CODE"
                required
              />

              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-lg text-gray-700 text-center text-lg font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
                placeholder="DEPARTMENT"
                required
              />
            </>
          )}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-3 mt-8">
          <div
            className={`w-3 h-3 rounded-full ${currentStep === 1 ? 'bg-white' : 'bg-gray-500'}`}
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          ></div>
          <div
            className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-white' : 'bg-gray-500'}`}
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Registration;
