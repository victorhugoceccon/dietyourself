export default {
  apps: [{
    name: 'gibaapp-api',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    // Reiniciar se usar muita memória
    max_memory_restart: '1G',
    // Reiniciar após muitas reinicializações
    min_uptime: '10s',
    max_restarts: 10
  }]
}
