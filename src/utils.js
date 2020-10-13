const { verify } = require('jsonwebtoken');
const { verifyJWT } = require('./services/auth-service');

const getUserId = async(req) => {
  const auth = req.get('Authorization') || '';

  if(auth) {
    const token = auth.slice('Bearer '.length, auth.length);
    const { userId } = verifyJWT(token);
    return userId;
  }

  throw new Error('UNAUTHORIZED_REQUEST');
}

module.exports = {
  getUserId,
}