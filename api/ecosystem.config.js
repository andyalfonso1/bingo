module.exports = {
  apps: [
    {
      name: "ganaconlosprimos-api",
      script: "dist/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
