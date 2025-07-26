// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const userService = require('../services/userService');

module.exports = function (passport) {
  // Local Strategy for email and password authentication
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await userService.findUserByEmail(email);
          if (!user) {
            return done(null, false, { message: 'No user found with that email.' });
          }
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );


  // Serialize user information into session
  passport.serializeUser((user, done) => done(null, user.id));

  // Deserialize user from session using the user ID
  passport.deserializeUser(async (id, done) => {
   
    try {
      const user = await userService.findUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
