const {
  validatePassword,
  hashPassword,
  comparePasswords,
  createJWT,
} = require('../services/auth-service');

const {
  getUserByUsername,
  insertNewUser,
} = require('../services/user-service');

const login = async({ username, password }, { prisma }) => {
  try {
    const user = await getUserByUsername(username, prisma);
    if(!user) throw new Error('INCORRECT_CREDENTIALS');

    const match = await comparePasswords(password, user.password);
    if(!match) throw new Error('INCORRECT_CREDENTIALS');

    const token = createJWT(user);

    return {
      token,
      user
    };
  } catch(error) {
    throw new Error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const signup = async({ input }, { prisma }) => {
  const { username, password } = input;
    try {
      let user = await getUserByUsername(username, prisma);
      if(user) throw new Error('DUPLICATE_USERNAME');

      validatePassword(password);

      const hashedPassword = await hashPassword(password, 12);

      // Alternatively, input.password = hashedPassword
      const newUser = {
        ...input,
        password: hashedPassword
      }

      user = await insertNewUser(newUser, prisma);

      const token = createJWT(user);

      return {
        token,
        user
      };
    } catch(error) {
      throw new Error(error.message);
    } finally {
      await prisma.$disconnect();
    }
}

module.exports = {
  login,
  signup,
}