module.exports = {
  apps: [{
    name: 'rental-api',
    script: './src/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080,
    },
    max_restarts: 10,
    restart_delay: 5000,
    error_file: '/var/log/rental/error.log',
    out_file:   '/var/log/rental/out.log',
  }],
};
