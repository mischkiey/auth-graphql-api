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

const app = express();
const prisma = new PrismaClient();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

// Todo:
// Rename endpoints/fields
// Factor out variables
// Consider using fragments for practice

// Stretch
// Add requireAuth middleware

// verifyJWT(token) {
//   return jwt.verify(token, JWT_SECRET, {
//       algorithm: 'HS256'
//   });
// }

const schema = buildSchema(`
  type Mutation {
    postUserSignUpInput(input: SignUpInput): String!
  }

  type Query {
    authUserLogInInput(username: String!, password: String!): String!
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
  if (password.length <= 8)
    return 'Password must be longer than 8 characters';

  if (password.length >= 72)
    return 'Password must be shorter than 72 characters';

  if (password.startsWith(' ') || password.endsWith(' '))
    return 'Password must must not start or end with spaces';

  if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password))
    return 'Password must contain 1 upper case, 1 lower case, 1 number, and 1 special character';
  
  return null;
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
  authUserLogInInput: async ({ username, password }) => {
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
      console.log('Meow?')
      await prisma.$disconnect();
    }
  },

  postUserSignUpInput: async ({ input }) => {
    const { username, password } = input;
    try {
      const user = await getUserByUsername(username);
      if(user) return 'Username already exists';

      const passwordError = validatePassword(password);
      if(passwordError) return passwordError;

      const hashedPassword = await bcrypt.hash(password, 12);

      // Alternatively, input.password = hashedPassword
      const newUser = {
        ...input,
        password: hashedPassword
      }

      await insertNewUser(newUser);
      return 'Successfully signed up';
    } catch(e) {
      console.log(e);
    } finally {
      await prisma.$disconnect();
    }
  }
}

graphql(schema, 'query { authUserLogInInput(username: "A", password: "!Expelliarmus01") }', root)
  .then((response) => {
    console.log(response);
  });

// graphql(schema, 'mutation { postUserSignUpInput(input: {firstName: "M", lastName: "F", email: "E", username: "A", password: "!Expelliarmus01"}) }', root)
//   .then((response) => {
//     console.log(response);
//   });

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

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