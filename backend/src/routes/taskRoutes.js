import express from 'express';

import { attachOrg } from '../middlewares/orgMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import {requireProjectRole} from '../middlewares/projectRbacMiddleware.js';
import { requireAdminOrProjectRole } from "../middlewares/requireAdminOrProjectRole.js";
import { ensureProjectIsActive } from '../middlewares/ensureProjectIsActive.js';

import { assignTask, createTask, deleteTask, getTaskById, listTasks, unassignTask, updateTask, updateTaskStatus,getMyTasks } from '../controllers/taskController.js';

const router = express.Router();

router.post("/projects/:projectId/tasks",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,createTask);
router.get("/projects/:projectId/tasks",authenticate,attachOrg,requireProjectRole(['MANAGER','MEMBER']),listTasks);
router.get("/projects/:projectId/tasks/:taskId",authenticate,attachOrg,requireProjectRole(['MANAGER','MEMBER']),getTaskById);

router.patch("/projects/:projectId/tasks/:taskId/assign",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,assignTask);
router.patch("/projects/:projectId/tasks/:taskId/unassign",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,unassignTask);
router.patch("/projects/:projectId/tasks/:taskId/status",authenticate,attachOrg,requireProjectRole(['MANAGER','MEMBER']),ensureProjectIsActive,updateTaskStatus);
router.patch("/projects/:projectId/tasks/:taskId",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,updateTask);
router.delete("/projects/:projectId/tasks/:taskId",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),deleteTask);

router.get('/my-tasks', authenticate,attachOrg,getMyTasks);

export default router;