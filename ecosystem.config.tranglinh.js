module.exports = {
  apps: [
    {
      name: 'tranglinh',
      script: 'server/index.mjs',
      exec_mode: 'fork',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        NITRO_PORT: 8288
      }
    }
  ]
}
