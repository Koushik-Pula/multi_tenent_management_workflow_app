import express from "express";

import { addProjectMember, archiveProject, createProject,getProjectById,listProjectMembers,listProjects, removeProjectMember, unarchiveProject, updateProject, updateProjectMemberRole } from "../controllers/projectController.js";

import { attachOrg } from '../middlewares/orgMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

import { requireAdminOrProjectRole } from "../middlewares/requireAdminOrProjectRole.js";
import { ensureProjectIsActive } from "../middlewares/ensureProjectIsActive.js";

const router = express.Router();

router.post("/",authenticate,attachOrg,requireRole(['ADMIN']),createProject);
router.get("/",authenticate,attachOrg,requireRole(['ADMIN','MEMBER']),listProjects);
router.get("/:projectId",authenticate,attachOrg,requireRole(['ADMIN','MEMBER']),getProjectById);
router.patch("/:projectId",authenticate,attachOrg,requireRole(['ADMIN']),updateProject);
router.patch("/:projectId/archive",authenticate,attachOrg,requireRole(['ADMIN']),archiveProject);
router.patch("/:projectId/unarchive",authenticate,attachOrg,requireRole(['ADMIN']),unarchiveProject);

router.post("/:projectId/members",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,addProjectMember);
router.get("/:projectId/members",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER','MEMBER']),listProjectMembers);
router.patch("/:projectId/members/:userId",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,updateProjectMemberRole);
router.delete("/:projectId/members/:userId",authenticate,attachOrg,requireAdminOrProjectRole(['MANAGER']),ensureProjectIsActive,removeProjectMember);

export default router;