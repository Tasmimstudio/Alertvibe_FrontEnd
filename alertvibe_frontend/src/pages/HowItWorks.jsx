import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ThemeSwitch from '../components/ThemeSwitch';

const Logo = () => (
  <div className="av-logo">
    <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
  </div>
);

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const steps = [
  {
    number: '01',
    title: 'Sensor Detects Vibration',
    color: '#4ade80',
    icon: '📳',
    description:
      'The SW-420 vibration sensor mounted on your motorcycle detects any movement or tampering. When someone touches, shakes, or attempts to move your bike, the sensor registers it as a vibration pulse.',
  },
  {
    number: '02',
    title: 'ESP32 Counts Pulses',
    color: '#60a5fa',
    icon: '🔢',
    description:
      'The ESP32 microcontroller counts how many vibration pulses occur within an 8-second window. More pulses = stronger detected vibration. This is how the system distinguishes a light touch from an actual theft attempt.',
  },
  {
    number: '03',
    title: 'Alert Level is Determined',
    color: '#f59e0b',
    icon: '⚖️',
    description:
      '1 pulse = Light, 3 pulses = Moderate, 6+ pulses = Strong. The ESP32 automatically escalates the alert level as vibration increases — sending a new alert each time a higher level is crossed.',
  },
  {
    number: '04',
    title: 'Alert Sent to Server',
    color: '#a78bfa',
    icon: '📡',
    description:
      'The ESP32 connects to WiFi and sends the alert to the AlertVibe cloud server (hosted on Render). The alert includes the device ID, severity level, location, and pulse count.',
  },
  {
    number: '05',
    title: 'Push Notification Delivered',
    color: '#f97316',
    icon: '🔔',
    description:
      'The server instantly sends a push notification to your phone via Firebase Cloud Messaging (FCM). You receive the alert even when the app is closed or in the background.',
  },
  {
    number: '06',
    title: 'View in Dashboard',
    color: '#ef4444',
    icon: '📊',
    description:
      'All alerts are stored in Firebase Firestore and visible in the AlertVibe dashboard. You can see live alerts, full history, and filter by severity, device, or date.',
  },
];

const alertLevels = [
  {
    level: 'LIGHT',
    pulses: '1–2 pulses',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.3)',
    icon: '📳',
    desc: 'Gentle vibration detected — could be wind, a passing vehicle, or someone brushing against your bike.',
  },
  {
    level: 'MODERATE',
    pulses: '3–5 pulses',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    icon: '⚠️',
    desc: 'Noticeable shaking — possible tampering. Someone may be attempting to move or break into your motorcycle.',
  },
  {
    level: 'STRONG',
    pulses: '6+ pulses',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    icon: '🚨',
    desc: 'Repeated strong vibration — high likelihood of theft in progress. Immediate action required.',
  },
];


const faqs = [
  {
    q: 'Why am I only getting Light alerts?',
    a: 'The sensor counts individual shake events. One hard shake still = 1 pulse = Light. You need 3 separate shake events within 8 seconds for Moderate, and 6 for Strong.',
  },
  {
    q: 'What happens when WiFi is lost?',
    a: 'The ESP32 automatically tries to reconnect. After 3 failed attempts it restarts itself and tries again. Alerts are not queued — they are sent in real-time only when WiFi is available.',
  },
  {
    q: 'Can I change the WiFi without re-flashing?',
    a: 'Yes. Update the WiFi credentials from the Admin Dashboard. The device polls the server on startup and automatically restarts with the new credentials.',
  },
  {
    q: 'How fast does the alert arrive on my phone?',
    a: 'Usually within 2–5 seconds when the backend is warm. The Render free-tier server can take up to 30 seconds to wake up from a cold start, which may delay the very first alert after a long idle period.',
  },
  {
    q: 'Will I get spammed with alerts?',
    a: 'No. There is a 5-second cooldown between alert sequences. Within a single sequence the device escalates (Light → Moderate → Strong) but won\'t repeat the same level twice.',
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  const navItems = [
    { key: 'home',    label: 'Home',    icon: <HomeIcon />,  onClick: () => navigate('/'),       activeColor: '#ef4444' },
    { key: 'tutorial', label: 'Guide',  icon: <span style={{ fontSize: 18 }}>?</span>, onClick: () => navigate('/how-it-works'), activeColor: '#60a5fa' },
  ];

  return (
    <div className="av-bg min-h-screen pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(10,19,33,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-xl transition-colors"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          >
            <BackIcon />
          </button>
          <Logo />
          <div>
            <p className="font-bold text-white text-sm leading-none">AlertVibe</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>How It Works</p>
          </div>
        </div>
        <ThemeSwitch />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8">

        {/* Hero */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(96,165,250,0.1))', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="text-4xl mb-3">🏍️</div>
          <h1 className="text-2xl font-bold text-white mb-2">How AlertVibe Works</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
            AlertVibe is a real-time motorcycle security system that uses a vibration sensor, WiFi, and push notifications to keep you informed the moment someone tampers with your bike.
          </p>
        </div>

        {/* System Flow */}
        <section>
          <h2 className="text-white font-bold text-base mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>System Flow</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="av-card rounded-2xl p-4 flex gap-4 items-start"
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-xs"
                  style={{ width: 40, height: 40, background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}33` }}
                >
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{step.icon}</span>
                    <p className="font-bold text-white text-sm">{step.title}</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="absolute"
                    style={{ display: 'none' }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Alert Levels */}
        <section>
          <h2 className="text-white font-bold text-base mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Alert Levels</h2>
          <div className="space-y-3">
            {alertLevels.map(lvl => (
              <div
                key={lvl.level}
                className="rounded-2xl p-4"
                style={{ background: lvl.bg, border: `1px solid ${lvl.border}` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: 22 }}>{lvl.icon}</span>
                  <div>
                    <span className="font-bold text-sm" style={{ color: lvl.color }}>{lvl.level}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${lvl.color}22`, color: lvl.color }}>{lvl.pulses}</span>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{lvl.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hardware */}
        <section>
          <h2 className="text-white font-bold text-base mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Hardware Components</h2>
          <div className="av-card rounded-2xl p-4 space-y-3">
            {[
              { icon: '🧠', name: 'ESP32 Microcontroller', desc: 'The brain of the device. Runs the firmware, manages WiFi, counts vibration pulses, and sends alerts to the server.' },
              { icon: '📳', name: 'SW-420 Vibration Sensor', desc: 'A spring-based sensor that generates electrical pulses when vibrated. Detects even subtle movement from a distance.' },
              { icon: '💡', name: '5 LED Indicators', desc: 'Visual indicators on the device that show the current status and alert level at a glance.' },
              { icon: '📶', name: 'WiFi (2.4GHz)', desc: 'The ESP32 connects to your local WiFi network to send alerts to the cloud server in real time.' },
            ].map((hw, i, arr) => (
              <div
                key={hw.name}
                className="flex gap-3 items-start"
                style={{ paddingBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <span style={{ fontSize: 22 }}>{hw.icon}</span>
                <div>
                  <p className="font-bold text-white text-sm">{hw.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>{hw.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testing Guide */}
        <section>
          <h2 className="text-white font-bold text-base mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>How to Test</h2>
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            {[
              { label: 'Get a Light alert', action: 'Tap the device once gently', result: 'Light alert sent' },
              { label: 'Get a Moderate alert', action: 'Tap 3 times within 8 seconds', result: 'Moderate alert sent' },
              { label: 'Get a Strong alert', action: 'Tap 6 times within 8 seconds', result: 'Strong alert sent' },
            ].map((test, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{test.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Do: {test.action}</p>
                  <p style={{ color: 'rgba(96,165,250,0.8)', fontSize: 12 }}>Result: {test.result}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-white font-bold text-base mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="av-card rounded-2xl p-4">
                <p className="font-bold text-white text-sm mb-1">{faq.q}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pb-4">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>AlertVibe — Real-time Motorcycle Security</p>
        </div>

      </div>

      <BottomNav items={navItems} activeKey="tutorial" />
    </div>
  );
}
