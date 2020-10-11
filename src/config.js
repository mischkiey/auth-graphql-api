module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV : process.env.NODE_ENV || 'development',
  DATABASE_URL : process.env.DATABASE_URL || 'postgresql://localhost/auth-graphql',
  JWT_SECRET : process.env.JWT_SECRET || 'not_a_working_secret'
};