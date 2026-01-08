module.exports = {
  apps: [
    {
      name: 'zenpos_quanly_vnnsoft',
      script: 'server/index.mjs',
      exec_mode: 'fork',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        NITRO_PORT: 8304
      }
    }
  ]
}
