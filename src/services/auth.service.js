const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const { signToken } = require('../utils/jwt');
const dataStore = require('../repositories/dataStore');

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    tenantId: user.tenantId,
    createdAt: user.createdAt
  };
}

async function register(payload) {
  const existingUser = await dataStore.findUserByEmail(payload.email);

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await dataStore.createUser({
    name: payload.name,
    email: payload.email,
    passwordHash,
    tenantId: payload.tenantId
  });

  const token = signToken({
    sub: user.id,
    tenantId: user.tenantId,
    email: user.email
  });

  return {
    token,
    user: sanitizeUser(user)
  };
}

async function login(payload) {
  const user = await dataStore.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({
    sub: user.id,
    tenantId: user.tenantId,
    email: user.email
  });

  return {
    token,
    user: sanitizeUser(user)
  };
}

module.exports = {
  register,
  login
};
