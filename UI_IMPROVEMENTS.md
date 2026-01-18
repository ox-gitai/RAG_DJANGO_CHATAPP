# UI Improvements - ChatPage, Login, and Register

This document describes UI improvements made to the chat application. These changes can be replicated by following the instructions below.

---

## 1. ChatPage Sidebar Scrollbar Hidden

**Goal**: Hide scrollbars in the sidebar while maintaining scroll functionality.

**Files**: `new-frontend/src/components/ChatPage.jsx`

**Changes**:
1. Add CSS class in the `<style>` block inside the component's JSX:
```css
.sidebar-hidden-scrollbar::-webkit-scrollbar { display: none; }
.sidebar-hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

2. Apply class `sidebar-hidden-scrollbar` to:
   - The main sidebar container div
   - The conversations list container div

---

## 2. ChatPage Conversations Section Full Height

**Goal**: Make conversations list utilize all available space between "New Chat" button and "Logout" button.

**Files**: `new-frontend/src/components/ChatPage.jsx`

**Changes**:
1. Change sidebar content wrapper to use flexbox:
```jsx
<div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
```

2. Change conversations container to use flex:
```jsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
```

3. Add `flexShrink: 0` to the conversations header `<h3>`

4. Change conversations list wrapper from `maxHeight: 'calc(100vh - 300px)'` to:
```jsx
<div className="sidebar-hidden-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
```

---

## 3. ChatPage Message Input Auto-Expand Textarea

**Goal**: Convert single-line input to auto-expanding textarea (max 7 lines, hidden scrollbar).

**Files**: `new-frontend/src/components/ChatPage.jsx`

**Changes**:
1. Replace `<input type="text">` with `<textarea>`:
```jsx
<textarea
    value={inputMessage}
    onChange={(e) => {
        setInputMessage(e.target.value);
        e.target.style.height = 'auto';
        const lineHeight = 21;
        const maxHeight = lineHeight * 7; // 7 lines max
        e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
        e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }}
    onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // call sendMessage if valid
        }
    }}
    rows={1}
    style={{
        resize: 'none',
        overflowY: 'hidden',
        minHeight: '44px',
        maxHeight: '147px',
        lineHeight: '21px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
        // ... other existing styles
    }}
/>
```

2. Update form container:
```jsx
<form style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
```

3. Fix send button size:
```jsx
<button style={{ height: '44px', flexShrink: 0, alignSelf: 'flex-end' }}>
```

---

## 4. Login Page Show/Hide Password Toggle

**Goal**: Add eye icon button to toggle password visibility.

**Files**: `new-frontend/src/components/Login.jsx`

**Changes**:
1. Add imports:
```jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
```

2. Add state:
```jsx
const [showPassword, setShowPassword] = useState(false);
```

3. Wrap password input in relative container and add toggle button:
```jsx
<div style={{ position: 'relative' }}>
    <input
        type={showPassword ? 'text' : 'password'}
        style={{ paddingRight: '48px' }}
        // ... other props
    />
    <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            pointerEvents: 'auto'
        }}
    >
        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
    </button>
</div>
```

---

## 5. Register Page Show/Hide Password Toggles

**Goal**: Add eye icon buttons to toggle both password and confirm password visibility.

**Files**: `new-frontend/src/components/RegisterPage.jsx`

**Changes**:
1. Add imports (same as Login)

2. Add state:
```jsx
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

3. Apply same wrapper + toggle button pattern to both password fields:
   - Password field: use `showPassword` / `setShowPassword`
   - Confirm password field: use `showConfirmPassword` / `setShowConfirmPassword`

---

## Dependencies

Ensure FontAwesome packages are installed:
```bash
npm install @fortawesome/react-fontawesome @fortawesome/free-regular-svg-icons
```
