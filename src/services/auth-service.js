const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const AuthService = {
  validatePassword: (password) => {
    if (password.length <= 8)
      throw new Error('SHORT_PASSWORD');
  
    if (password.length >= 72)
      throw new Error('LONG_PASSWORD');
    
    if (password.startsWith(' ') || password.endsWith(' '))
      throw new Error('AMBIGUOUS_PASSWORD');
      
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password))
      throw new Error('INVALID_PASSWORD');
  },

  hashPassword: (password) => {
    return bcrypt.hash(password, 12);
  },

  comparePasswords: (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
  },
  
  createJWT: (user) => {
    return jwt.sign(
      {userId: user.id},
      JWT_SECRET,
      {
        subject: user.username,
        algorithm: 'HS256'
      }
    );
  },

  verifyJWT: (token) => {
    return jwt.verify(token, JWT_SECRET, {
      algorithm: 'HS256'
    });
  }
}

module.exports = AuthService;