import { useState } from 'react'
import {
  AppClipboardBoundary,
  NoDragDropBoundary,
  InternalCopyAliasBoundary,
} from '@rizalsk/react-content-guard'

const articles = [
  {
    id: 1,
    title: 'Q4 2024 Financial Report',
    content:
      'Net revenue reached $420M in Q4 2024, up 18% year-over-year. Operating margin stands at 23.4%, driven by supply chain efficiency improvements and Southeast Asia market expansion.',
    tag: 'CONFIDENTIAL',
    tagColor: '#ef4444',
  },
  {
    id: 2,
    title: 'Product Roadmap 2025',
    content:
      'Phase 1 (Q1): Launch AI recommendation engine. Phase 2 (Q2): Regional payment gateway integration. Phase 3 (Q3–Q4): Expand to 5 new countries targeting 2 million active users.',
    tag: 'INTERNAL',
    tagColor: '#f59e0b',
  },
  {
    id: 3,
    title: 'Premium User Analytics',
    content:
      'Total premium accounts: 847,293. 30-day retention rate: 78.4%. Average revenue per user (ARPU): $8.90/month. Churn rate this month: 2.1%, down from 3.4% last month.',
    tag: 'RESTRICTED',
    tagColor: '#8b5cf6',
  },
]

export default function SecureContentExample() {
  const [warning, setWarning] = useState<string | null>(null)

  const showWarning = (msg: string) => {
    setWarning(msg)
    setTimeout(() => setWarning(null), 3000)
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>
        Combined: AppClipboard + NoDragDrop + InternalCopyAlias
      </h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Content below is protected by 3 layers: copy is routed to the internal clipboard,
        drag-and-drop is blocked, and the OS clipboard is wiped after each copy.
      </p>

      {warning && (
        <div style={{
          marginBottom: 12,
          padding: '8px 14px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 6,
          fontSize: 13,
          color: '#92400e',
        }}>
          ⚠️ {warning}
        </div>
      )}

      <AppClipboardBoundary enabled={true} onWarning={showWarning}>
        <NoDragDropBoundary className="nara-no-drag" enabled={true}>
          <InternalCopyAliasBoundary enabled={true} restoreDelay={100}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {articles.map((article) => (
                <div
                  key={article.id}
                  style={{
                    padding: 16,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    position: 'relative',
                  }}
                >
                  {/* Tag */}
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#fff',
                    background: article.tagColor,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {article.tag}
                  </span>

                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, marginRight: 80 }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>
                    {article.content}
                  </p>

                  {/* Escape hatch demo */}
                  <div
                    data-allow-native-copy="true"
                    style={{
                      marginTop: 10,
                      padding: '6px 10px',
                      background: '#f0fdf4',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#16a34a',
                      border: '1px dashed #86efac',
                    }}
                  >
                    🟢 This area uses <code>data-allow-native-copy</code> — normal copy to OS clipboard still works here
                  </div>
                </div>
              ))}
            </div>

            {/* Paste test area */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                Paste here to verify internal clipboard is working:
              </p>
              <textarea
                rows={3}
                placeholder="Press Ctrl+V here after copying from the content above..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 13,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

          </InternalCopyAliasBoundary>
        </NoDragDropBoundary>
      </AppClipboardBoundary>
    </div>
  )
}
