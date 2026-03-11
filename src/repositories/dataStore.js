const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { dataFile } = require('../config/env');

const defaultDb = {
  users: [],
  projects: []
};

let writeQueue = Promise.resolve();

async function ensureDbFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch (error) {
    await fs.writeFile(dataFile, JSON.stringify(defaultDb, null, 2));
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  const parsed = raw ? JSON.parse(raw) : defaultDb;

  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : []
  };
}

function commit(mutator) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    const nextDb = await mutator(db);
    await fs.writeFile(dataFile, JSON.stringify(nextDb, null, 2));
    return nextDb;
  });

  return writeQueue;
}

async function findUserByEmail(email) {
  const db = await readDb();
  return db.users.find((user) => user.email === email.toLowerCase()) || null;
}

async function findUserById(id) {
  const db = await readDb();
  return db.users.find((user) => user.id === id) || null;
}

async function createUser(userInput) {
  const user = {
    id: uuidv4(),
    name: userInput.name,
    email: userInput.email.toLowerCase(),
    passwordHash: userInput.passwordHash,
    tenantId: userInput.tenantId,
    createdAt: new Date().toISOString()
  };

  await commit((db) => {
    db.users.push(user);
    return db;
  });

  return user;
}

async function getProjectsByOwner(ownerId, tenantId) {
  const db = await readDb();
  return db.projects.filter((project) => project.ownerId === ownerId && project.tenantId === tenantId);
}

async function findProjectById(projectId) {
  const db = await readDb();
  return db.projects.find((project) => project.id === projectId) || null;
}

async function createProject(projectInput) {
  const project = {
    id: uuidv4(),
    title: projectInput.title,
    description: projectInput.description,
    status: projectInput.status,
    ownerId: projectInput.ownerId,
    tenantId: projectInput.tenantId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await commit((db) => {
    db.projects.push(project);
    return db;
  });

  return project;
}

async function updateProject(projectId, updateInput) {
  let updatedProject = null;

  await commit((db) => {
    db.projects = db.projects.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      updatedProject = {
        ...project,
        ...updateInput,
        updatedAt: new Date().toISOString()
      };

      return updatedProject;
    });

    return db;
  });

  return updatedProject;
}

async function deleteProject(projectId) {
  let deleted = false;

  await commit((db) => {
    const initialLength = db.projects.length;
    db.projects = db.projects.filter((project) => project.id !== projectId);
    deleted = db.projects.length < initialLength;
    return db;
  });

  return deleted;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getProjectsByOwner,
  findProjectById,
  createProject,
  updateProject,
  deleteProject
};
