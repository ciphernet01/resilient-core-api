const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  dataFile: path.resolve(process.cwd(), process.env.DATA_FILE || './data/db.json'),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
