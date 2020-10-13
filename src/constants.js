exports.errorObject = {
  INCORRECT_CREDENTIALS: {
    message: 'Incorrect username or password',
    statusCode: 401
  },

  DUPLICATE_USERNAME: {
    message: 'Username already taken',
    statusCode: 400
  },

  SHORT_PASSWORD: {
    message: 'Password must be longer than 8 characters',
    statusCode: 400
  },

  LONG_PASSWORD: {
    message: 'Password must be shorter than 72 characters',
    statusCode: 400
  },

  AMBIGUOUS_PASSWORD: {
    message: 'Password must must not start or end with spaces',
    statusCode: 400
  },

  INVALID_PASSWORD: {
    message: 'Password must contain 1 upper case, 1 lower case, 1 number, and 1 special character',
    statusCode: 400
  }
}