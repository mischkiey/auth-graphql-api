require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');
const { PrismaClient } = require('@prisma/client');

const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');
const { errorObject } = require('./constants');

const app = express();
const prisma = new PrismaClient();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

const verifyJWT = (token) => {
  return jwt.verify(token, JWT_SECRET, {
      algorithm: 'HS256'
  });
}

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

const getUserByUsername = async(username) => {
  const user = await prisma.user.findOne({where: { username }});
  return user;
}

const insertNewUser = async(input) => {
  await prisma.user.create({
    data: input
  });
}

const validatePassword = (password) => {
  if (password.length <= 8) throw new Error('SHORT_PASSWORD');

  if (password.length >= 72) throw new Error('LONG_PASSWORD');
  
  if (password.startsWith(' ') || password.endsWith(' ')) throw new Error('AMBIGUOUS_PASSWORD');
    
  if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) throw new Error('INVALID_PASSWORD');
}

const createJsonWebToken = (user) => {
  return jwt.sign(
    {userId: user.id},
    JWT_SECRET,
    {
      subject: user.username,
      algorithm: 'HS256'
    }
  );
}

const root = {
  authUserLogInInput: async ({ username, password }, request) => {
    // Validate if password is correct dummy
    try {
      const user = await getUserByUsername(username);
      if(!user) return 'Invalid username';

      const match = await bcrypt.compare(password, user.password);
      if(!match) return 'Invalid password';

      const token = createJsonWebToken(user);
      return token;
    } catch(e) {
      console.log(e);
    } finally {
      await prisma.$disconnect();
    }
  },

  postUserSignUpInput: async ({ input }) => {
    const { username, password } = input;
    try {
      const user = await getUserByUsername(username);
      if(user) throw new Error('DUPLICATE_USERNAME');

      validatePassword(password);

      const hashedPassword = await bcrypt.hash(password, 12);

      // Alternatively, input.password = hashedPassword
      const newUser = {
        ...input,
        password: hashedPassword
      }
      await insertNewUser(newUser);

      const token = createJsonWebToken(newUser);
      return token;
    } catch(error) {
      throw new Error(error.message);
    } finally {
      await prisma.$disconnect();
    }
  },
}

const test = {
  hello: () => {
    return 'Hello world'
  }
}

// graphql(schema, '{ hello }', test)
//   .then((response) => {
//   console.log(response);
//   });

app.use('/graphql', (req, res, next) => {
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    customFormatErrorFn: (error) => {
      const { message, statusCode } = errorObject[error.message];
      res.status(statusCode);
      return (message);
    },
    graphiql: true,
  })
  (req, res);
})

// app.use('/graphql', graphqlHTTP({
//   schema: schema,
//   rootValue: test,
//   graphiql: true,
// }));

app.use(function errorHandler(error, req, res, next) { /* eslint-disable-line no-unused-var */
  let response;

  if (NODE_ENV === 'production') {
    response = { error: { message: 'Internal server error' } };
  } else {
    console.log(error);
    response = { message: error.message, error }
  };

  res.status(500).json(response);
});

module.exports = app;