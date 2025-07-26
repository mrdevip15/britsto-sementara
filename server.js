// server.js
const app = require('./app');
const PORT = process.env.PORT || 3972;
const sequelize = require('./config/sequelize'); // Sequelize instance

async function syncDatabase() {
  // Check the environment and set `force` or `alter` based on the environment
  const environment = process.env.NODE_ENV || 'development';
  let syncOptions = {};

  if (environment === 'development') {
    syncOptions.alter = true; // Drop and recreate tables in development for testing purposes
  } else if (environment === 'production') {
    syncOptions.alter = true; // Use alter in production to prevent data loss
  }
  // No options set for test to keep it neutral and ensure migrations are tested if used

  try {
    await sequelize.sync(syncOptions);
    console.log(`Database synced successfully in ${environment} mode.`);
  } catch (error) {
    console.error('Error syncing database:', error);
  }
}

// Call the function to sync the database based on the environment
syncDatabase();


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const environment = process.env.NODE_ENV || 'development'; // Defaults to 'development' if NODE_ENV is undefined

  if (environment === 'development') {
    console.log("Running in development mode");
  } else if (environment === 'test') {
    console.log("Running in test mode");
  } else if (environment === 'production') {
    console.log("Running in production mode");
  }

});
