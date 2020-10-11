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

const schema = buildSchema(`
  type Mutation {
    postUserSignUpInputs(firstName: String!, lastName: String!, email: String!, username: String!, password: String!): User
  }

  type Query {
    hello: String
    user: User
  }
  
  type User {
    authUserLogInInputs(username: String!, password: String!): String!
  }
`);

const fakeUserDatabase = {
  username: 'admin',
  password: 'pass',
};

class User {
  postUserSignUpInputs({ firstName, lastName, email, username, password }) {
    console.log('Hello')
    fakeUserDatabase.user = {
      firstName,
      lastName,
      email,
      username,
      password
    }

    return 'Successfully set up account'
  }

  authUserLogInInputs({ username, password }) {
    // Todo:
    // [] No username
    // [] No password

    console.log(username, password)

    if(username !== fakeUserDatabase.username) {
      return 'Incorrect Username'
    } 
    
    if(password !== fakeUserDatabase.password) {
      return 'Incorrect password'
    }

    // Return token
    return 'Successfully logged in'
  }
}

const root = {
  hello: () => {
    return 'Hello, world!';
  },

  user: () => {
    return new User();
  },

  postUserSignUpInputs: () => {
    return new User();
  }
}

graphql(schema, 'mutation { postUserSignUpInputs(firstName: "M", lastName: "F", email: "E", username: "U", password: "P") }', root)
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