const { getUserByUserId } = require('../services/user-service');
const { getUserId } = require('../utils');

const user = async(args, { req, prisma }) => {
  try {
    const userId = getUserId(req);
    const user = await getUserByUserId(userId, prisma);
    return user;
  } catch(error) {
    throw new Error('UNAUTHORIZED_REQUEST');
  }
}

module.exports = {
  user,
}