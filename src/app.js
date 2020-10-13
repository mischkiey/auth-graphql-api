require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');
const { PrismaClient } = require('@prisma/client');

const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const { errorObject } = require('./constants');

const {
  validatePassword,
  hashPassword,
  comparePasswords,
  createJWT,
} = require('./services/auth-service');

const {
  getUserByUsername,
  insertNewUser,
} = require('./services/user-service');


const app = express();
const prisma = new PrismaClient();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

const schema = buildSchema(`
  type Mutation {
    postUserSignUpInput(input: SignUpInput): String!
  }

  type Query {
    authUserLogInInput(username: String!, password: String!): String!
    user(authToken: String!): String!
    hello: String!
  }

  input SignUpInput {
    firstName: String!
    lastName: String!
    email: String!
    username: String!
    password: String!
  }
`);

const root = {
  authUserLogInInput: async({ username, password }) => {
    try {
      const user = await getUserByUsername(username, prisma);
      if(!user) throw new Error('INCORRECT_CREDENTIALS');

      const match = await comparePasswords(password, user.password);
      if(!match) throw new Error('INCORRECT_CREDENTIALS');

      const token = createJWT(user);
      return token;
    } catch(error) {
      throw new Error(error.message);
    } finally {
      await prisma.$disconnect();
    }
  },

  postUserSignUpInput: async ({ input }) => {
    const { username, password } = input;
    try {
      const user = await getUserByUsername(username, prisma);
      if(user) throw new Error('DUPLICATE_USERNAME');

      validatePassword(password);

      const hashedPassword = await hashPassword(password, 12);

      // Alternatively, input.password = hashedPassword
      const newUser = {
        ...input,
        password: hashedPassword
      }
      await insertNewUser(newUser, prisma);

      const token = createJWT(newUser);
      return token;
    } catch(error) {
      throw new Error(error.message);
    } finally {
      await prisma.$disconnect();
    }
  },
}

app.use('/graphql', (req, res, next) => {
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    customFormatErrorFn: (error) => {
      const { message, statusCode = null } = errorObject[error.message] || error;
      if(statusCode) res.status(statusCode);
      return (message);
    },
    graphiql: true,
  })
  (req, res);
})

module.exports = app;