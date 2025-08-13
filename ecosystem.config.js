module.exports = {
  apps: [
    {
      name: 'webgg', // Replace with your app name
      script: './server.js', // Path to your server file
      exec_mode: 'cluster',
      instances: 'max',
      watch: false,
      ignore_watch: [
        'uploads', // Ignore the uploads directory
        '*.jpg', // Ignore all JPG images
        '*.jpeg', // Ignore all JPEG images
        '*.png', // Ignore all PNG images
        '*.gif', // Ignore all GIF images
        '*.svg', // Ignore all SVG images
      ],
      env: {
        NODE_ENV: 'production', // default env
        PORT: 3972,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3972,
        PROD_DB_HOST: '127.0.0.1',
        PROD_DB_PORT: 5433,
        PROD_DB_USERNAME: 'postgres',
        PROD_DB_PASSWORD: 'topsecret',
        PROD_DB_NAME: 'geniusgate_development',
        REDIS_URL: 'redis://127.0.0.1:6379',
      },
    },
    {
      name: 'webhook', // Name for your webhook app
      script: './webhook.js', // Path to your webhook file
      exec_mode: 'cluster',
      instances: 1,
      env: {
        NODE_ENV: 'production', // Set environment variables for webhook
        PORT: 6969, // Set a different port for webhook if needed
      },
    },
  ],
};
