# @rizalsk/react-content-guard

React/Next.js components for protecting content from copying, screen recording, drag-drop, and clipboard misuse.

## Requirements

This library has **no bundled dependencies**. `react` and `react-dom` are expected to already be present in your project. If you haven't installed `zustand` yet, add it:

```bash
npm install zustand
```

| Package     | Version |
|-------------|---------|
| `react`     | `>=18`  |
| `react-dom` | `>=18`  |
| `zustand`   | `>=5`   |

## Installation

```bash
npm install @rizalsk/react-content-guard
```

---

## Components

### `ScreenProtector`

Protects content from screen recording and DevTools inspection. Blurs content when a screenshot is detected and shows an overlay when DevTools is open.

```tsx
import { ScreenProtector } from '@rizalsk/react-content-guard'

<ScreenProtector
  enabled={true}
  latchTitle="Protected Content"
  latchMessage="Click here to display the content again."
  devTools={true}
  devtoolsTitle="Restricted Access"
  devtoolsMessage="Close developer tools to continue."
>
  {children}
</ScreenProtector>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable all protection |
| `devTools` | `boolean` | `true` | Detect and block DevTools |
| `devtoolsTitle` | `string` | `"Protected Content"` | Overlay title when DevTools detected |
| `devtoolsMessage` | `string` | `"Developer tools detected..."` | Overlay message |
| `latchTitle` | `string` | `"Content Hidden"` | Title shown on screenshot latch overlay |
| `latchMessage` | `string` | `"Click to show the content again."` | Message on latch overlay |
| `latchBackgroundVariant` | `ProtectorCanvasVariant` | `"grid"` | Background pattern of overlay |
| `latchBackgroundColor` | `string` | `"#0b0f1a"` | Overlay background color |
| `latchPatternColor` | `string` | `"#4f9eff"` | Overlay pattern/foreground color |
| `latchPatternOpacity` | `number` | `0.08` | Overlay pattern opacity (0–1) |
| `latchAnimationPaused` | `boolean` | `false` | Pause the overlay animation |
| `overlayTextColor` | `string` | `"#f5f5f5"` | Text and icon color for all overlays |
| `recordingFlicker` | `boolean` | `true` | Enable anti-recording watermark |
| `recordingFlickerMode` | `"auto" \| "temporal" \| "chromatic" \| "scan" \| "static"` | `"auto"` | Flicker mode |
| `recordingFlickerIntensity` | `number` | `0.06` | Watermark intensity (0–1) |
| `recordingFlickerText` | `string` | `"PROTECTED"` | Watermark text |

---

### `AppClipboardBoundary`

Intercepts copy and paste events within its boundary, routing them through an internal clipboard store (backed by `zustand`). Prevents content from leaking to the OS clipboard.

```tsx
import { AppClipboardBoundary } from '@rizalsk/react-content-guard'

<AppClipboardBoundary
  enabled={true}
  onWarning={(msg) => console.warn(msg)}
>
  {children}
</AppClipboardBoundary>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable clipboard interception |
| `className` | `string` | — | CSS class for wrapper div |
| `onWarning` | `(msg: string) => void` | `console.warn` | Called when paste fails (no content or non-editable target) |

**Escape hatch:** Add `data-allow-native-copy="true"` or `data-allow-native-paste="true"` to any child element to bypass interception for that element.

---

### `InternalCopyAliasBoundary`

Intercepts copy/cut events and blocks the OS clipboard, routing text to the internal store. Also provides a custom right-click context menu with a "Copy" option.

```tsx
import { InternalCopyAliasBoundary } from '@rizalsk/react-content-guard'

<InternalCopyAliasBoundary enabled={true} restoreDelay={100}>
  {children}
</InternalCopyAliasBoundary>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable interception |
| `className` | `string` | — | CSS class for wrapper div |
| `restoreDelay` | `number` | `100` | Delay (ms) before wiping OS clipboard after copy |

**Escape hatch:** Add `data-allow-native-copy="true"` to bypass copy interception, or `data-allow-native-contextmenu="true"` to allow the native right-click menu.

---

### `CopyExtensionProtector`

Prevents browser extensions and native events from reading selected content by clearing the selection after a short delay.

```tsx
import { CopyExtensionProtector } from '@rizalsk/react-content-guard'

<CopyExtensionProtector enabled={true} clearDelay={120}>
  {children}
</CopyExtensionProtector>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable protection |
| `className` | `string` | — | CSS class for wrapper div |
| `clearDelay` | `number` | `120` | Delay (ms) before clearing selection |

**Escape hatch:** Add `data-allow-native-copy="true"` to any child to bypass selection clearing for that element.

---

### `CopyProtector`

Simple component that blocks copy events and disables text selection via CSS.

```tsx
import { CopyProtector } from '@rizalsk/react-content-guard'

<CopyProtector
  enabled={true}
  onWarning={(msg) => console.warn(msg)}
>
  {children}
</CopyProtector>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable copy blocking |
| `className` | `string` | — | CSS class for wrapper div |
| `onWarning` | `(msg: string) => void` | `console.warn` | Called when a copy attempt is blocked |

---

### `NoDragDropBoundary`

Prevents drag-and-drop of content out of the boundary.

```tsx
import { NoDragDropBoundary } from '@rizalsk/react-content-guard'

<NoDragDropBoundary enabled={true} className="my-boundary">
  {children}
</NoDragDropBoundary>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable drag-drop blocking |
| `className` | `string` | — | CSS class for wrapper div |

**Escape hatch:** Add `data-allow-drag="true"` to any child element to allow dragging that specific element.

---

## Hooks

### `useSecureCopy`

Copies data to the internal clipboard store and wipes the OS clipboard so the content cannot be pasted outside the application.

```tsx
import { useSecureCopy } from '@rizalsk/react-content-guard'

function MyComponent() {
  const { secureCopy } = useSecureCopy()

  const handleCopy = () => {
    secureCopy({
      source: 'global',
      type: 'text',
      text: 'sensitive content',
    })
  }

  return <button onClick={handleCopy}>Copy</button>
}
```

### `useAppClipboardStore`

Direct access to the internal clipboard zustand store. Useful for reading or clearing clipboard state from anywhere in the app.

```tsx
import { useAppClipboardStore } from '@rizalsk/react-content-guard'

function MyComponent() {
  const payload = useAppClipboardStore((s) => s.payload)
  const clearClipboard = useAppClipboardStore((s) => s.clearClipboard)

  return (
    <div>
      <p>Internal clipboard: {payload?.text ?? '(empty)'}</p>
      <button onClick={clearClipboard}>Clear</button>
    </div>
  )
}
```

---

## Full Example

```tsx
import {
  ScreenProtector,
  AppClipboardBoundary,
  NoDragDropBoundary,
  InternalCopyAliasBoundary,
} from '@rizalsk/react-content-guard'

<ScreenProtector enabled={true} devTools={true}>
  <AppClipboardBoundary
    enabled={true}
    onWarning={(msg) => toast.warning(msg)}
  >
    <NoDragDropBoundary enabled={true}>
      <InternalCopyAliasBoundary enabled={true}>
        {children}
      </InternalCopyAliasBoundary>
    </NoDragDropBoundary>
  </AppClipboardBoundary>
</ScreenProtector>
```

---

## `onWarning` Callback

`AppClipboardBoundary` and `CopyProtector` accept an `onWarning` prop instead of depending on any UI library. Wire it to your preferred notification system:

```tsx
// with react-hot-toast
import toast from 'react-hot-toast'
<AppClipboardBoundary onWarning={(msg) => toast(msg)}>

// with sonner
import { toast } from 'sonner'
<AppClipboardBoundary onWarning={(msg) => toast.warning(msg)}>

// with antd
import { App } from 'antd'
const { message } = App.useApp()
<AppClipboardBoundary onWarning={(msg) => message.warning(msg)}>

// default — console.warn (no UI notification)
<AppClipboardBoundary>
```

---

## License

MIT © rizalsk
