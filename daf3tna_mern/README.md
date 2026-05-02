# Daf3tna (دفعتنا) 🎓🚀

**Daf3tna** is a premium, production-ready social networking platform specifically designed for university students. Built on the **MERN stack**, it provides a secure, private, and engaging environment where students can connect with their specific batch, share content, and participate in community activities.

---

## ✨ Key Features

### 🛡️ Batch Isolation System
- **Privacy First:** Students are automatically grouped by their University, Major, and Graduation Year.
- **Closed Ecosystem:** Users only see content (Posts, Stories, Hubs) from their own batch, ensuring a focused and safe environment.

### 💬 Real-Time Interaction
- **Instant Messaging:** Seamless DMs and group chats powered by **Socket.io**.
- **Community Hubs:** Discord-like servers with dedicated text and voice channels for different subjects or interests.
- **Vibes Section:** 
  - **Confessions:** Share thoughts anonymously (fully secured).
  - **Panics (فزعة):** Ask for urgent academic help with real-time notifications.
  - **Awards:** Nominate and vote for fun titles within the batch.

### 🎮 Premium User Experience
- **Sleek UI:** Modern Glassmorphism design with a fully responsive layout.
- **Stories:** Share your daily university moments with 24h disappearing snippets.
- **Yearbook:** A digital directory of all students in your batch.

### 🛰️ Admin Command Center (Superadmin Console)
- **Global Overview:** Monitor all batches, posts, and users from one central hub.
- **Site Control:** Toggle features (DMs, Stories, Registration) on/off globally.
- **Maintenance Modes:** 4-tier security lockdown system (Soft, Read-Only, Lockdown, Emergency).
- **Broadcast System:** Send emergency red-banner alerts to all active users instantly.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Zustand (State Management), Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB with Mongoose ODM.
- **Real-time:** Socket.io.
- **Media:** Cloudinary Integration for high-speed image uploads.
- **Auth:** JWT (JSON Web Tokens) with secure HTTP-only cookie patterns.

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/daf3tna.git
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file with:
   # PORT=5003
   # MONGO_URI=your_mongodb_uri
   # JWT_SECRET=your_secret
   # CLOUDINARY_URL=your_cloudinary_url
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📸 Screenshots
*(Add your screenshots here to show off the beautiful UI!)*

---

## 📜 License
This project is private and developed for academic/social purposes.

---

**Developed with ❤️ for the student community.**
