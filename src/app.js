require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');


const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const e = require('express');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

// Add token type
// User service object for validation
// Connect to PostgreSQL with Prisma

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

const fakeUserDatabase = {
  username: 'admin',
  password: 'pass',
};

const root = {
  hello: () => {
    return 'Hello, world!';
  },

  authUserLogInInput: ({ username, password }) => {
    // Validate no username
    // Validate no password
    if(username !== fakeUserDatabase.username) {
      return 'Incorrect Username'
    } 
    
    if(password !== fakeUserDatabase.password) {
      return 'Incorrect password'
    }

    // Return token
    return 'Successfully logged in'
  },

  postUserSignUpInput: ({ input }) => {
    // Validate fields
    console.log(input);
    return 'Successfully signed up'
  }
}

graphql(schema, 'mutation { postUserSignUpInput(input: {firstName: "M", lastName: "F", email: "E", username: "U", password: "P"}) }', root)
  .then((response) => {
    console.log(response);
  });

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