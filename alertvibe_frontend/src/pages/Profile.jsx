// pages/Profile.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { useToast } from '../components/Toast';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import ThemeSwitch from '../components/ThemeSwitch';

const Logo = () => (
  <div className="av-logo">
    <img src="/alertvibe-logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
  </div>
);
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const Section = ({ title, children }) => (
  <div className="glass p-6 flex flex-col gap-4">
    <h3 className="text-white font-bold text-base tracking-wide">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, userProfile, updateProfile, fetchUserProfile } = useAuth();
  const photoInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone]             = useState(userProfile?.phoneNumber || '');
  const [savingInfo, setSavingInfo]   = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw]   = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const initials = (userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  /* ── Save display info ─────────────────────────────────────── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { toast('Display name is required.', 'warning'); return; }
    setSavingInfo(true);
    try {
      await updateProfile({ displayName: displayName.trim(), phoneNumber: phone.trim() });
      toast('Profile updated successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  /* ── Change password ───────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPw) { toast('Enter your current password.', 'warning'); return; }
    if (newPw.length < 6) { toast('New password must be at least 6 characters.', 'warning'); return; }
    if (newPw !== confirmPw) { toast('Passwords do not match.', 'warning'); return; }
    setSavingPw(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      toast('Password changed successfully.', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const msg = err.code === 'auth/wrong-password'
        ? 'Current password is incorrect.'
        : err.message || 'Failed to change password.';
      toast(msg, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Photo upload ──────────────────────────────────────────── */
  const handlePhotoFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Photo must be less than 5 MB.', 'warning'); return; }
    setUploadingPhoto(true);
    try {
      await userApi.uploadProfilePhoto(file);
      await fetchUserProfile(currentUser);   // re-fetch profile to pull new photoURL
      toast('Profile photo updated.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
              <span className="text-green-400 text-xs font-semibold tracking-wider">CONNECTED</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-2xl mx-auto w-full flex flex-col gap-6 mobile-pb">
        <h2 className="text-white font-bold text-2xl tracking-wide">My Profile</h2>

        {/* Avatar + photo upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile"
                   className="w-20 h-20 rounded-full object-cover"
                   style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl text-white"
                   style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 2px 8px rgba(6,182,212,0.5)' }}
              title="Change photo"
            >
              {uploadingPhoto
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CameraIcon />
              }
            </button>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{userProfile?.displayName || '—'}</p>
            <p className="text-white/40 text-sm">{currentUser?.email}</p>
            <span className="badge badge-blue mt-1 capitalize">{userProfile?.role || 'user'}</span>
          </div>
        </div>

        {/* Personal info */}
        <Section title="Personal Information">
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
            <Field label="Display Name">
              <input
                type="text"
                className="av-input"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                className="av-input"
                value={currentUser?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </Field>
            <Field label="Phone Number">
              <input
                type="tel"
                className="av-input"
                placeholder="e.g. +63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <button type="submit" disabled={savingInfo} className="btn-red self-start px-8">
              {savingInfo ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Section>

        {/* Change password */}
        <Section title="Change Password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Field label="Current Password">
              <input
                type="password"
                className="av-input"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                className="av-input"
                placeholder="At least 6 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                className="av-input"
                placeholder="Repeat new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button type="submit" disabled={savingPw} className="btn-red self-start px-8">
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </Section>
      </main>
    </div>
  );
}
