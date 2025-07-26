// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' 
          ? process.env.GOOGLE_CALLBACK_URL_PROD 
          : process.env.GOOGLE_CALLBACK_URL_DEV
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if profile has email
          if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            return done(new Error('No email found in Google profile'), null);
          }
          
          // Check if user already exists with this email
          const existingUser = await userService.findUserByEmail(profile.emails[0].value);
          
          if (existingUser) {
            // Update Google ID if not set
            if (!existingUser.google_id) {
              await userService.updateUser(existingUser.id, {
                google_id: profile.id,
                photos: profile.photos[0]?.value || existingUser.photos
              });
            }
            return done(null, existingUser);
          }
          
          // Create new user with Google profile
          const newUser = await userService.saveUser({
            email: profile.emails[0].value,
            password: 'google_oauth_' + Math.random().toString(36), // Random password for OAuth users
            nama: profile.displayName,
            google_id: profile.id,
            photos: profile.photos[0]?.value || '',
            // Set default values for required fields
            asal_sekolah: '',
            paket: 'tryout',
            jenjang: 'sma',
            program: 'gg-lite',
            phone: '',
            nama_ortu: '',
            no_hp_ortu: '',
            createdAt: new Date()
          });
          
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
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
