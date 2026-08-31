# Nayak State Lifecycle Plan

This document defines the three user-facing state groups we need for a smooth product experience:

1. Auth state
2. Session/history state
3. AI request state

The goal is to make every screen and interaction explain what is happening, instead of feeling silent or frozen.

---

## Phase 1: Auth state

### Goal
Make login, registration, guest login, and token verification clearly visible to the user.

### Tasks
- [x] Define auth states
  - `idle`
  - `checking-token`
  - `signing-in`
  - `registering`
  - `guest-login`
  - `authenticated`
  - `auth-error`
- [x] Add `authStatus` and `authError` to the app state
- [x] Update the login screen to show status text for each action
- [x] Handle token refresh / invalid token case gracefully
- [x] Clear auth state on logout and redirect to login screen
- [x] Add front-end retry handling for failed login/register requests

### UI behavior
- On page load:
  - show `Checking saved session...`
- On sign in:
  - show `Signing you in...`
- On register:
  - show `Creating your account...`
- On guest login:
  - show `Launching guest access...`
- On failure:
  - show `Authentication failed: <message>`

### Acceptance criteria
- User always knows whether the app is checking auth, logging in, or waiting
- No blank screen during login or guest flow
- Errors are visible and actionable

---

## Phase 2: Session and history state

### Goal
Make chat session creation and history loading visible and predictable.

### Tasks
- [x] Define session states
  - `initializing`
  - `creating-session`
  - `loading-history`
  - `ready`
  - `empty-session`
  - `history-error`
- [x] Add `sessionStatus`, `sessionError`, and `historyLoaded` flags
- [x] Show loading message when session is being created
- [x] Show loading message when saved chat history is fetching
- [x] Show empty-state message when no old messages exist
- [x] Show connection error if the backend is unavailable
- [x] Clear stale session data on logout

### UI behavior
- After login:
  - show `Creating your chat session...`
- While fetching history:
  - show `Loading your saved chat history...`
- If session is empty:
  - show `No previous messages in this session.`
- If backend fails:
  - show `Backend unavailable — check the API server.`

### Acceptance criteria
- The user knows whether the app is creating a conversation or restoring a previous one
- History loading is visible and not silent
- Empty and error states are not confused with loading

---

## Phase 3: AI command lifecycle state

### Goal
Make every AI interaction communicate progress to the user.

### Tasks
- [x] Define AI states
  - `idle`
  - `listening`
  - `processing`
  - `thinking`
  - `responding`
  - `error`
- [x] Add a visible command pipeline status in the UI header
- [x] Show `Listening...` when microphone receives input
- [x] Show `Processing request...` while sending to backend
- [x] Show `Generating answer...` if backend is replying slowly
- [x] Keep state from resetting prematurely during speech synthesis
- [x] Display backend failure message if the request fails

### UI behavior
- Before sending command:
  - show `Processing request...`
- During voice capture:
  - show `Listening...`
- When backend response is pending:
  - show `Generating answer...`
- On failure:
  - show `Could not reach the backend. Check the API server.`

### Acceptance criteria
- User sees the AI is active when it is working
- There is no confusion between mic listening and backend processing
- Error states are visible and recoverable

---

## Recommended implementation order

### Step 1: auth first
Start with auth state because it blocks everything else.

1. Create `authState` values in the app
2. Connect them to login / register / guest login handlers
3. Show status text and error text in the login component
4. Test login success and login failure

### Step 2: session state second
Once auth is stable, add session creation and history loading states.

1. Add `sessionStatus` to the main app
2. Show a message while creating a session
3. Show a message while loading history
4. Display empty and failed states clearly

### Step 3: AI state third
Once the user is authenticated and history works, implement the AI interaction states.

1. Add `commandStatus` and `commandError`
2. Set states during voice input and backend request
3. Keep state transitions explicit and user-readable
4. Add retries and visible failure messages

---

## Suggested state object shape

```js
const appState = {
  auth: {
    status: 'idle' | 'checking-token' | 'signing-in' | 'registering' | 'authenticated' | 'auth-error',
    error: null | 'Invalid credentials'
  },
  session: {
    status: 'initializing' | 'creating-session' | 'loading-history' | 'ready' | 'empty' | 'error',
    error: null | 'Backend unavailable'
  },
  ai: {
    status: 'idle' | 'listening' | 'processing' | 'thinking' | 'responding' | 'error',
    error: null | 'Could not reach the backend'
  }
}
```

---

## Implementation notes

- Keep states explicit and avoid hidden asynchronous transitions
- Do not rely only on console logs for errors
- Make every state visible in the UI header or form area
- Prefer small, readable messages over long technical text
- Use consistent wording across login, session, and AI states

---

## Final target
By the end of this work, a user should always be able to answer these questions:

- Am I logged in?
- Is the app checking my session?
- Is it creating a conversation?
- Is it loading old messages?
- Is the AI listening, processing, or responding?
- Did something fail and why?

That will make Nayak feel reliable and intentional instead of silent.
