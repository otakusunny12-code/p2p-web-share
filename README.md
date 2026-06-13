# P2P Web Share — Setup & Deployment Guide

Everything you need to go from zero to a live, working deployment.
Follow the steps in order.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Firebase Setup](#3-firebase-setup)
4. [Environment Variables](#4-environment-variables)
5. [Run Locally](#5-run-locally)
6. [GitHub Repository Setup](#6-github-repository-setup)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Firebase Security Rules](#8-firebase-security-rules)
9. [Testing the App End-to-End](#9-testing-the-app-end-to-end)
10. [Troubleshooting](#10-troubleshooting)
11. [Demo Script](#11-demo-script-for-judges)

---

## 1. Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 or later | https://nodejs.org |
| npm | comes with Node | — |
| Git | any recent | https://git-scm.com |

Verify with:
```bash
node -v
npm -v
git -v
```

You also need:
- A **Google account** (for Firebase)
- A **GitHub account** (for source control)
- A **Vercel account** (free — sign up at https://vercel.com with your GitHub)

---

## 2. Clone & Install

```bash
# Clone the repo (replace with your repo URL after pushing)
git clone https://github.com/YOUR_USERNAME/p2p-web-share.git
cd p2p-web-share

# Install dependencies
npm install
```

---

## 3. Firebase Setup

This is the most important step. Firebase is used **only** for signaling
(exchanging WebRTC connection metadata). No file data ever goes to Firebase.

### Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Give it a name e.g. `p2p-web-share`
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2 — Add a Web App

1. On the project overview page, click the **`</>`** (Web) icon
2. Give the app a nickname e.g. `p2p-web-share-web`
3. Do **not** enable Firebase Hosting (we're using Vercel)
4. Click **"Register app"**
5. You'll see a `firebaseConfig` object — **copy all the values**, you'll need them in step 4

Example of what you'll see:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 3 — Enable Realtime Database

1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose a location (pick the one closest to you)
4. When asked for security rules, select **"Start in test mode"**
   (We'll tighten these in Step 8)
5. Click **"Enable"**

### Step 4 — Get your Database URL

After enabling, you'll see a URL that looks like:
```
https://your-project-default-rtdb.firebaseio.com
```
Copy this — it's your `VITE_FIREBASE_DATABASE_URL`.

---

## 4. Environment Variables

In the project root, copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in all the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Important:** Never commit `.env` to GitHub. It is listed in `.gitignore` and will be ignored automatically.

---

## 5. Run Locally

```bash
npm run dev
```

Open your browser at http://localhost:5173

To test the full flow locally:
1. Open http://localhost:5173 in **Tab 1** (sender)
2. Select a file and click "Create Room"
3. Copy the room link
4. Open the link in **Tab 2** (receiver)
5. Watch the connection establish and the file transfer

---

## 6. GitHub Repository Setup

### Create a new repository on GitHub

1. Go to https://github.com/new
2. Repository name: `p2p-web-share`
3. Visibility: Public (required for free Vercel deployments)
4. Do **not** initialize with README (your project already has files)
5. Click **"Create repository"**

### Push your code

```bash
# Inside your project folder
git init
git add .
git commit -m "Initial commit — P2P Web Share MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/p2p-web-share.git
git push -u origin main
```

---

## 7. Deploy to Vercel

### Step 1 — Import the project

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Find and select `p2p-web-share`
4. Click **"Import"**

### Step 2 — Configure the project

Vercel auto-detects Vite. The settings should be:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Step 3 — Add environment variables

Before clicking Deploy, scroll to **"Environment Variables"** and add each key from your `.env` file:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | your value |
| `VITE_FIREBASE_AUTH_DOMAIN` | your value |
| `VITE_FIREBASE_DATABASE_URL` | your value |
| `VITE_FIREBASE_PROJECT_ID` | your value |
| `VITE_FIREBASE_STORAGE_BUCKET` | your value |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your value |
| `VITE_FIREBASE_APP_ID` | your value |

### Step 4 — Deploy

Click **"Deploy"**. Vercel will build and publish your app.
In about 60 seconds, you'll get a live URL like:
```
https://p2p-web-share-abc123.vercel.app
```

### Step 5 — Future deployments

Every `git push` to `main` automatically triggers a new deployment on Vercel.
No manual steps needed.

---

## 8. Firebase Security Rules

The default "test mode" rules allow anyone to read/write for 30 days.
Before submitting or presenting, tighten the rules:

1. Go to Firebase Console → Realtime Database → **Rules**
2. Replace the existing rules with:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        // Anyone can create and read a room
        ".read": true,
        ".write": true,
        // Automatically delete rooms older than 1 hour
        // (implement via Cloud Functions for full automation,
        // or manually clean from the console after testing)
      }
    }
  }
}
```

3. Click **"Publish"**

> For a hackathon demo, test mode rules are fine.
> Just remember to clean up old rooms manually from the Firebase console after your demo.

---

## 9. Testing the App End-to-End

### Same device, two tabs (quick test)

1. Open your deployed URL in **Chrome Tab 1**
2. Select any file (try a small image or PDF first)
3. Click **"Create Room"**
4. Copy the room link
5. Open the link in **Chrome Tab 2**
6. Watch:
   - Connection status goes green in both tabs
   - Click "Send File" in Tab 1
   - Progress bar appears in Tab 2
   - File downloads automatically in Tab 2
   - Hash verification shows ✓

### Two different devices (real P2P test)

1. Open the app on **Device A** (the sender)
2. Select a file, create a room
3. Share the link via WhatsApp, Airdrop, or just text it
4. Open the link on **Device B** (the receiver)
5. Watch the direct transfer happen

### Verify the file

After the transfer, compare the original and received file:
- On Mac: `shasum -a 256 original.pdf` and `shasum -a 256 received.pdf`
- On Windows (PowerShell): `Get-FileHash original.pdf -Algorithm SHA256`
- Both should match the hash shown in the app UI.

---

## 10. Troubleshooting

### "Room not found" on receiver

- The sender may not have finished creating the room before you opened the link
- Try refreshing the receiver tab
- Check the Firebase console to confirm the room node exists under `rooms/`

### Connection stuck on "Connecting"

- Most likely a network or firewall issue blocking UDP (used by WebRTC)
- Test first on the same Wi-Fi network
- Corporate/university networks sometimes block WebRTC — test on mobile data as a fallback
- STUN servers (Google's, used here) handle most NAT traversal cases

### Firebase errors in the console

- Double-check all `VITE_` environment variables are set correctly in Vercel
- Make sure the Realtime Database is enabled (not Firestore)
- Make sure the Database URL includes `https://` and ends with `.firebaseio.com`

### "Cannot read properties of undefined" on import

- Run `npm install` again to ensure all dependencies are present
- Make sure you're using Node 18+

### Hash mismatch

- This should be extremely rare with WebRTC's built-in reliability
- If it happens, it usually means the transfer was interrupted — retry

### Large files (>500 MB)

- Browser memory is the limiting factor for this MVP
- For large files, the receiver holds all chunks in memory before reassembling
- IndexedDB support for chunk streaming is a planned future improvement

---

## 11. Demo Script for Judges

Use this script when recording a demo video or presenting live.

```
"This is P2P Web Share — a browser-to-browser file sharing tool
built with WebRTC and React. No file ever touches a server.

[Open the app]

"I'll start by selecting a file — let's use this 5 MB PDF."

[Drop the file onto the drop zone]

"I'll click Create Room. This generates a unique room ID and
saves just the connection metadata to Firebase Realtime Database —
not the file itself."

[Click Create Room — room page opens]

"Here's my room link. I'll copy it and open it in a second window,
simulating the receiver."

[Open link in Tab 2]

"The receiver's browser immediately starts the WebRTC handshake —
offer, answer, and ICE candidate exchange all happen through Firebase
in under a second."

[Connection state goes green in both tabs]

"Now I'll click Send File on the sender side."

[Click Send File]

"You can see the progress bar updating in real time on the receiver's
side. The file is travelling directly from my browser to the other —
no upload, no server round-trip."

[Transfer completes — file downloads automatically]

"The file downloaded automatically. And here's the important part —
SHA-256 integrity verification. The sender hashed the file before
sending. The receiver hashed the reassembled file. They match."

[Point to the green hash card]

"This proves the file arrived byte-perfect. No corruption,
no tampering possible in transit."
```

---

## Project Structure Reference

```
p2p-web-share/
├── index.html               # Entry HTML, loads fonts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind theme tokens
├── postcss.config.js        # PostCSS for Tailwind
├── package.json             # Dependencies
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
└── src/
    ├── main.jsx             # React entry point
    ├── App.jsx              # Router setup
    ├── styles/
    │   └── index.css        # Tailwind + global styles
    ├── lib/
    │   ├── constants.js     # Tunable config (chunk size, ICE servers)
    │   ├── firebase.js      # Firebase app initialization
    │   ├── signaling.js     # All Firebase read/write logic
    │   ├── webrtc.js        # RTCPeerConnection — sender + receiver
    │   ├── fileChunker.js   # Async generator for file chunks
    │   ├── hash.js          # SHA-256 via Web Crypto API
    │   └── download.js      # Blob → browser download trigger
    ├── hooks/
    │   └── useTransferLog.js # Hook for the event log
    ├── components/
    │   ├── ConnectionStatus.jsx  # Live connection state dot
    │   ├── ProgressBar.jsx       # Transfer progress + speed
    │   ├── Dropzone.jsx          # Drag-and-drop file selector
    │   ├── RoomLinkCard.jsx      # Shareable link + copy button
    │   └── TransferLog.jsx       # Scrollable event log
    └── pages/
        ├── Home.jsx         # Landing page (sender starts here)
        └── Room.jsx         # Room page (sender + receiver both use this)
```

---
