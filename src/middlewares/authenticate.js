const AppError = require('../utils/appError');
const { verifyToken } = require('../utils/jwt');
const dataStore = require('../repositories/dataStore');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await dataStore.findUserById(decoded.sub);

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId
    };

    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      ? new AppError('Invalid or expired token', 401)
      : error);
  }
}

module.exports = authenticate;
