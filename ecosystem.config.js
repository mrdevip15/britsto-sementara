module.exports = {
  apps: [
    {
      name: 'webgg', // Replace with your app name
      script: './server.js', // Path to your server file
      watch: true, // Enable watch mode
      ignore_watch: [
        'uploads', // Ignore the uploads directory
        '*.jpg', // Ignore all JPG images
        '*.jpeg', // Ignore all JPEG images
        '*.png', // Ignore all PNG images
        '*.gif', // Ignore all GIF images
        '*.svg', // Ignore all SVG images
      ],
      env: {
        NODE_ENV: 'production', // Set your environment variables
        PORT: 3972, // Set the port if needed
      },
    },
    {
      name: 'webhook', // Name for your webhook app
      script: './webhook.js', // Path to your webhook file
      env: {
        NODE_ENV: 'production', // Set environment variables for webhook
        PORT: 6969, // Set a different port for webhook if needed
      },
    },
  ],
};
