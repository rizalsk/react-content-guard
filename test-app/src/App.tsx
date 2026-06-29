import { useState } from 'react'
import {
  ScreenProtector,
  AppClipboardBoundary,
  InternalCopyAliasBoundary,
  CopyExtensionProtector,
  CopyProtector,
  NoDragDropBoundary,
} from '@rizalsk/react-content-guard'
import SecureContentExample from './SecureContentExample'

// Simple toast for onWarning callback
function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }
  return { msg, show }
}

export default function App() {
  const { msg, show } = useToast()

  const [screenEnabled, setScreenEnabled] = useState(true)
  const [clipboardEnabled, setClipboardEnabled] = useState(true)
  const [internalCopyEnabled, setInternalCopyEnabled] = useState(true)
  const [extensionProtectorEnabled, setExtensionProtectorEnabled] = useState(true)
  const [copyProtectorEnabled, setCopyProtectorEnabled] = useState(true)
  const [noDragEnabled, setNoDragEnabled] = useState(true)

  return (
    <ScreenProtector 
      latchBackgroundVariant="rings"
      latchBackgroundColor="#dbddf1ff"
      latchPatternColor="#0e719eff"
      overlayTextColor='#30323fff'
      latchPatternOpacity={.23}
      latchAnimationPaused={false}
      enabled={screenEnabled}>
      <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: 24 }}>

        {/* Toast */}
        {msg && (
          <div style={{
            position: 'fixed', top: 16, right: 16, zIndex: 9999,
            background: '#1e1e2e', color: '#cdd6f4', padding: '10px 18px',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: 14,
          }}>
            ⚠️ {msg}
          </div>
        )}

        <h1 style={{ fontSize: 22, marginBottom: 4 }}>@rizalsk/react-content-guard</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Test playground — toggle each protection on/off</p>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
          {[
            ['ScreenProtector', screenEnabled, setScreenEnabled],
            ['AppClipboard', clipboardEnabled, setClipboardEnabled],
            ['InternalCopyAlias', internalCopyEnabled, setInternalCopyEnabled],
            ['ExtensionProtector', extensionProtectorEnabled, setExtensionProtectorEnabled],
            ['CopyProtector', copyProtectorEnabled, setCopyProtectorEnabled],
            ['NoDragDrop', noDragEnabled, setNoDragEnabled],
            // ['RecordingFlicker', flickerEnabled, setFlickerEnabled],
          ].map(([label, value, setter]) => (
            <label key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
              />
              {label as string}
            </label>
          ))}
        </div>

        {/* RecordingFlicker (standalone) */}
        {/* {flickerEnabled && <RecordingFlicker text="TEST WATERMARK" mode="auto" intensity={0.08} />} */}

        {/* AppClipboardBoundary */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>AppClipboardBoundary</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Copy text below → paste into the input. Should stay within app clipboard (not OS clipboard).
          </p>
          <AppClipboardBoundary enabled={clipboardEnabled} onWarning={show}>
            <div style={{ padding: 12, background: '#f0f4ff', borderRadius: 6, marginBottom: 8, userSelect: 'text' }}>
              Select and copy this secret text: <strong>INTERNAL_SECRET_42</strong>
            </div>
            <input
              type="text"
              placeholder="Paste here..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
            />
          </AppClipboardBoundary>
        </section>

        {/* InternalCopyAliasBoundary */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>InternalCopyAliasBoundary</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Right-click or Ctrl+C inside — copies to internal store, OS clipboard wiped.
          </p>
          <InternalCopyAliasBoundary enabled={internalCopyEnabled} restoreDelay={100}>
            <div style={{ padding: 12, background: '#f0fff4', borderRadius: 6, userSelect: 'text' }}>
              Try to copy this: <strong>CONFIDENTIAL_DATA_XYZ</strong>
              <br />
              <span data-allow-native-copy="true" style={{ fontSize: 12, color: '#888' }}>
                (this span has data-allow-native-copy — normal copy works here)
              </span>
            </div>
          </InternalCopyAliasBoundary>
        </section>

        {/* CopyExtensionProtector */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>CopyExtensionProtector</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Selection is cleared after {120}ms — try selecting text below.
          </p>
          <CopyExtensionProtector enabled={extensionProtectorEnabled} clearDelay={120}>
            <div style={{ padding: 12, background: '#fff8f0', borderRadius: 6, userSelect: 'text' }}>
              Try selecting this text — selection should disappear quickly.
            </div>
          </CopyExtensionProtector>
        </section>

        {/* CopyProtector */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>CopyProtector</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Blocks copy event entirely and disables text selection.
          </p>
          <CopyProtector enabled={copyProtectorEnabled} onWarning={show}>
            <div style={{ padding: 12, background: '#fff0f0', borderRadius: 6 }}>
              This content cannot be copied. Right-click is also disabled.
            </div>
          </CopyProtector>
        </section>

        {/* NoDragDropBoundary */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>NoDragDropBoundary</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Drag is blocked. Items with <code>data-allow-drag</code> can still be dragged.
          </p>
          <NoDragDropBoundary enabled={noDragEnabled}>
            <div style={{ display: 'flex', gap: 12 }}>
              <img
                src="https://picsum.photos/seed/guard/120/80"
                alt="protected"
                style={{ borderRadius: 6, cursor: 'grab' }}
              />
              <img
                data-allow-drag="true"
                src="https://picsum.photos/seed/allowed/120/80"
                alt="draggable"
                style={{ borderRadius: 6, cursor: 'grab', outline: '2px solid #22c55e' }}
              />
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              Left image: drag blocked. Right image (green border, data-allow-drag): drag allowed.
            </p>
          </NoDragDropBoundary>
        </section>

        {/* ---- Combined Example: Full Secure Content ---- */}
        <hr style={{ margin: '32px 0', border: 'none', borderTop: '2px dashed #e5e7eb' }} />
        <section style={{ marginBottom: 24 }}>
          <SecureContentExample />
        </section>

      </div>
    </ScreenProtector>
  )
}
