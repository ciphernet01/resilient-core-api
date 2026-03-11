const express = require('express');
const { body, param } = require('express-validator');
const projectController = require('../controllers/project.controller');
const authenticate = require('../middlewares/authenticate');
const validateRequest = require('../middlewares/validateRequest');
const { allowedStatuses } = require('../services/project.service');

const router = express.Router();

const projectIdValidation = [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  validateRequest
];

const createProjectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Title must be at most 150 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('status').optional().isIn(allowedStatuses).withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
  validateRequest
];

const updateProjectValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }).withMessage('Title must be at most 150 characters'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty').isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('status').optional().isIn(allowedStatuses).withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
  validateRequest
];

router.use(authenticate);

router.get('/', projectController.listProjects);
router.get('/:projectId', projectIdValidation, projectController.getProject);
router.post('/', createProjectValidation, (req, res, next) => {
  req.body.status = req.body.status || 'planned';
  next();
}, projectController.createProject);
router.put('/:projectId', [...projectIdValidation, ...updateProjectValidation], projectController.updateProject);
router.patch('/:projectId', [...projectIdValidation, ...updateProjectValidation], projectController.updateProject);
router.delete('/:projectId', projectIdValidation, projectController.deleteProject);

module.exports = router;
