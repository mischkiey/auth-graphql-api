const UserService = {
  getUserByUsername: async(username, prisma) =>
    await prisma.user.findOne({ where: { username }}),

  getUserByUserId: async(userId, prisma) =>
    await prisma.user.findOne({ where: { id: userId }}),

  insertNewUser: async (newUser, prisma) =>
    await prisma.user.create({ data: newUser }),
}

module.exports = UserService;