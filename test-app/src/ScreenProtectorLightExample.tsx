import { ScreenProtector } from '@rizalsk/react-content-guard'

export default function ScreenProtectorLightExample() {
  return (
    <ScreenProtector
      enabled={true}
      devTools={true}
      // --- Overlay canvas ---
      latchBackgroundVariant="grid"
      latchBackgroundColor="#f8fafc"
      latchPatternColor="#6366f1"
      latchPatternOpacity={0.18}
      latchAnimationPaused={false}
      // --- Overlay text ---
      overlayTextColor="#1e293b"
      latchTitle="Content Protected"
      latchMessage="Click anywhere to view the content again."
      devtoolsTitle="Developer Tools Detected"
      devtoolsMessage="Please close developer tools to continue."
      // --- Recording watermark ---
      recordingFlicker={true}
      recordingFlickerMode="auto"
      recordingFlickerIntensity={0.05}
      recordingFlickerText="CONFIDENTIAL"
    >
      {/* Sample protected content */}
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 40,
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>SecureApp</span>
          </div>
          <div style={{
            fontSize: 12,
            color: '#64748b',
            background: '#f1f5f9',
            padding: '4px 12px',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
          }}>
            🔒 Protected Content
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'Total Revenue', value: '$2.4M', change: '+12.5%', up: true },
            { label: 'Active Users', value: '48,291', change: '+8.1%', up: true },
            { label: 'Churn Rate', value: '2.3%', change: '-0.4%', up: false },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 500 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: stat.up ? '#10b981' : '#ef4444',
              }}>
                {stat.change} vs last month
              </div>
            </div>
          ))}
        </div>

        {/* Content card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Recent Transactions</span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#6366f1',
              background: '#eef2ff',
              padding: '3px 10px',
              borderRadius: 20,
            }}>RESTRICTED</span>
          </div>

          {[
            { name: 'Enterprise License', amount: '+$12,400', date: 'Today, 09:41', status: 'completed' },
            { name: 'API Overage Fee', amount: '-$340', date: 'Yesterday, 14:22', status: 'completed' },
            { name: 'Pro Plan Renewal', amount: '+$4,800', date: 'Jun 27, 11:05', status: 'pending' },
            { name: 'Refund — Order #8821', amount: '-$199', date: 'Jun 26, 08:30', status: 'refunded' },
          ].map((tx, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              borderBottom: i < 3 ? '1px solid #f8fafc' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{tx.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{tx.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: tx.status === 'completed' ? '#f0fdf4' : tx.status === 'pending' ? '#fefce8' : '#fef2f2',
                  color: tx.status === 'completed' ? '#16a34a' : tx.status === 'pending' ? '#ca8a04' : '#dc2626',
                }}>
                  {tx.status}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: tx.amount.startsWith('+') ? '#10b981' : '#ef4444',
                }}>
                  {tx.amount}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 24 }}>
          Try pressing PrtScr or opening DevTools to see the overlay in action.
        </p>
      </div>
    </ScreenProtector>
  )
}
