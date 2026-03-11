const AppError = require('../utils/appError');
const dataStore = require('../repositories/dataStore');

const allowedStatuses = ['planned', 'in-progress', 'completed', 'archived'];

function normalizeProject(project) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
    tenantId: project.tenantId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

async function listProjects(user) {
  const projects = await dataStore.getProjectsByOwner(user.id, user.tenantId);
  return projects.map(normalizeProject);
}

async function getProjectById(projectId, user) {
  const project = await dataStore.findProjectById(projectId);

  if (!project || project.tenantId !== user.tenantId) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== user.id) {
    throw new AppError('Forbidden', 403);
  }

  return normalizeProject(project);
}

async function createProject(payload, user) {
  if (!allowedStatuses.includes(payload.status)) {
    throw new AppError('Invalid project status', 400);
  }

  const project = await dataStore.createProject({
    title: payload.title,
    description: payload.description,
    status: payload.status,
    ownerId: user.id,
    tenantId: user.tenantId
  });

  return normalizeProject(project);
}

async function updateProject(projectId, payload, user) {
  const project = await dataStore.findProjectById(projectId);

  if (!project || project.tenantId !== user.tenantId) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== user.id) {
    throw new AppError('Forbidden', 403);
  }

  if (payload.status && !allowedStatuses.includes(payload.status)) {
    throw new AppError('Invalid project status', 400);
  }

  const updatedProject = await dataStore.updateProject(projectId, {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {})
  });

  return normalizeProject(updatedProject);
}

async function deleteProject(projectId, user) {
  const project = await dataStore.findProjectById(projectId);

  if (!project || project.tenantId !== user.tenantId) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== user.id) {
    throw new AppError('Forbidden', 403);
  }

  await dataStore.deleteProject(projectId);
}

module.exports = {
  allowedStatuses,
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
