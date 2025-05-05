// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Получаем токен из заголовка
  const token = req.header('x-auth-token');
  
  // Проверяем наличие токена
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Добавляем пользователя в запрос
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};