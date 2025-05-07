// server/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Генерация JWT токена
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "7d" }
  );
};

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Received password during registration:', password); // Добавьте это

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    const trimmedPassword = password.trim();
    console.log('Trimmed password:', trimmedPassword); // Добавьте это
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);
    console.log('Generated hash:', hashedPassword); // Добавьте это

    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();
    console.log('User saved to database:', user); // Добавьте это

    const token = generateToken(user);

    if (res.cookie) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Вход пользователя
exports.login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Поиск пользователя
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log("Found user:", user ? "Yes" : "No"); // Более безопасное логирование

    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Проверка пароля
    const trimmedPassword = password.trim();
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
      console.log(
      "Password match:",
      isMatch,
      "Input password:",
      password,
      "Stored hash:",
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Генерация токена
    const token = generateToken(user);

    // Устанавливаем cookie если используете cookies
    if (res.cookie) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });
    }

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Получение данных о пользователе
exports.getMe = async (req, res) => {
  try {
    // req.user.id установлен в middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Обновление пароля пользователя
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
