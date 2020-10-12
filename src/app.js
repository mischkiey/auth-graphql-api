require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');

const { PrismaClient } = require('@prisma/client');

const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const e = require('express');

const app = express();
const prisma = new PrismaClient();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

const getUserByUsername = async(username) => {
  const user = await prisma.user.findOne({where: { username }});
  return user;
}

const insertNewUser = async(input) => {
  await prisma.user.create({
    data: input
  });
}

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

const root = {
  authUserLogInInput: async ({ username, password }) => {
    // Validate no username
    // Validate no password
    // if(username !== fakeUserDatabase.username) {
    //   return 'Incorrect Username'
    // } 
    
    // if(password !== fakeUserDatabase.password) {
    //   return 'Incorrect password'
    // }

    try {
      const user = await getUserByUsername(username);
      console.log(user);
    } catch(e) {
      console.log(e);
    } finally {
      await prisma.$disconnect();
    }

    // Return token
    return 'Successfully logged in'
  },

  postUserSignUpInput: async ({ input }) => {
    // Validate fields
    console.log(input);
    try {
      await insertNewUser(input);
      const user = await getUserByUsername(input.username);
      console.log(user);
    } catch(e) {
      console.log(e);
    } finally {
      await prisma.$disconnect();
    }

    return 'Successfully signed up'
  }
}

graphql(schema, 'query { authUserLogInInput(username: "U", password: "P") }', root)
  .then((response) => {
    console.log(response);
  });

// graphql(schema, 'mutation { postUserSignUpInput(input: {firstName: "M", lastName: "F", email: "E", username: "U", password: "P"}) }', root)
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