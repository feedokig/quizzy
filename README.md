# Quizzy 🎯

**Quizzy** is a real-time, multiplayer quiz platform inspired by Kahoot, built using the **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO**. It allows users to create and host live quizzes with interactive gameplay features like power-ups, scoring systems and real-time updates.

---

## 🌐 Live Demo

- **Frontend**: [https://quizzy-client-bktl.onrender.com](https://quizzy-client-bktl.onrender.com)
- **Backend API**: [https://quizzy-backend-1cq8.onrender.com](https://quizzy-backend-1cq8.onrender.com)
- **GitHub Repository**: [Quizzy GitHub](https://github.com/feedokig/quizzy)

---

## 🚀 Features

### 🧑‍💻 For Hosts:
- Create and manage quizzes with multiple questions and answers
- Enable boosts (50/50)
- Generate game PINs for players to join
- See live player list and remove players
- Start game and control question flow in real time

### 🎮 For Players:
- Join games using a PIN code
- Answer questions and see feedback instantly
- Use boosts strategically to improve score
- Enjoy real-time UI updates and animations

### 🧠 Quiz Features:
- Multiple-choice questions
- **50/50** Boosts
- End screen with score and ranking

---

## 🛠 Tech Stack

| Frontend            | Backend            | Realtime        | Database   | Deployment   |
|---------------------|--------------------|------------------|-------------|-------------|
| React + Tailwind    | Node.js + Express  | Socket.IO         | MongoDB     | Render     |

---

## 📂 Project Structure

```bash
quizzy/
├── client/             # React frontend
│   └── src/
│       └── pages/
│       └── components/
├── server/             # Express backend
│   └── models/
│   └── routes/
│   └── controllers/
│   └── sockets/
├── README.md
```

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Deforkk/quizzy.git
cd quizzy
```

### 2. Backend Setup

```bash
cd server
npm install
# Configure MongoDB URI and other env variables in .env
npm start
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

> Make sure the backend is running on port `5000` and the frontend on `3000`. They communicate via API and WebSockets.

---

## ⚙️ Environment Variables (Server)

Create a `.env` file in the `server/` folder with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## 🥪 Future Improvements

- Player avatars and chat
- More boosts and gamification
- Quiz categories and filtering
- Admin panel for reports/statistics
- Mobile app version (React Native / Kotlin)

---

## 🡡 Use Cases

- 📚 Schools and universities
- 👨‍💼 Corporate training
- 🤩 Party games and events

---

## 📬 Feedback & Contributions

Pull requests and issues are welcome! Feel free to fork the repo and suggest new features or improvements.

---

Made with ❤️ by [feedokig](https://github.com/feedokig) & [holerrrr](https://github.com/holerrrr)


