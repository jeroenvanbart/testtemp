module.exports = {
  apps: [
    {
      name: 'ble-server',
      exec_mode: 'fork',
      instances: 'max', // Or a number of instances
      script: './app.js',
      cron_restart: '0 8 * * *',
      args: 'start'
    }
  ]
}
