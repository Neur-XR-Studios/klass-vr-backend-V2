const { version } = require("../../package.json");
const config = require("../config/config");

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "klass-Vr API documentation",
    version,
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
    {
      url: `https://44.200.7.3/v1`,
    },
    {
      url: `https://klassdraw.com/v1`,
    },
  ],
};

module.exports = swaggerDef;
