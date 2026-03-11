const projectService = require('../services/project.service');

async function listProjects(req, res, next) {
  try {
    const projects = await projectService.listProjects(req.user);
    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.projectId, req.user);
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user);
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body, req.user);
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.projectId, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
};
