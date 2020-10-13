const UserService = {
  getUserByUsername: async(username, prisma) =>
    await prisma.user.findOne({ where: { username }}),

  insertNewUser: async (newUser, prisma) =>
    await prisma.user.create({ data: newUser }),
}

module.exports = UserService;