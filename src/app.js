 require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { PrismaClient } = require('@prisma/client');

const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const { errorObject } = require('./constants/error');

const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');

// Instantiations
const app = express();
const prisma = new PrismaClient();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

const schema = buildSchema(`
  type Query {
    user: User
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload
    signup(input: SignupInput): AuthPayload
  }

  type AuthPayload {
    token: String
    user: User
  }

  type User  {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    username: String!
  }

  input SignupInput {
    firstName: String!
    lastName: String!
    email: String!
    username: String!
    password: String!
  }
`);

const root = {
  ...Query,
  ...Mutation
}

app.use('/graphql', (req, res) => {
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    context: {
      req,
      prisma
    },
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