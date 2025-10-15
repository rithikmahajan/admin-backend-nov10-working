module.exports = {
  apps: [{
    name: "yoraa-api",
    script: "index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
      PORT: 8080
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8080,
      HOST: "0.0.0.0"
    },
    log_file: "/var/log/pm2/yoraa-api.log",
    error_file: "/var/log/pm2/yoraa-api-error.log",
    out_file: "/var/log/pm2/yoraa-api-out.log"
  }]
};
