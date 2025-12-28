import express from 'express';
import { createInvite,acceptInvite,listUsers, updateUserRole, deactivateUser, reactivateUser, getMyProfile,updateMyProfile,getDashboardStats} from '../controllers/userController.js';

//middleware imports
import { attachOrg } from '../middlewares/orgMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

//user routes with authentication and role-based access control
router.post("/invite",authenticate,attachOrg,requireRole(['ADMIN']),createInvite);
router.post("/accept-invite",acceptInvite);
router.get("/",authenticate,attachOrg,requireRole(['ADMIN']),listUsers);
router.patch("/:userId/role",authenticate,attachOrg,requireRole(['ADMIN']),updateUserRole);
router.patch("/:userId/deactivate",authenticate,attachOrg,requireRole(['ADMIN']),deactivateUser);
router.patch("/:userId/reactivate",authenticate,attachOrg,requireRole(['ADMIN']),reactivateUser);
router.get("/me/profile", authenticate, attachOrg, getMyProfile);
router.patch("/me/profile", authenticate, attachOrg, updateMyProfile);
router.get("/stats", authenticate, attachOrg, getDashboardStats);


export default router;