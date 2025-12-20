import express from "express";
import { getAuditLogs, getProjectAuditLogs } from "../controllers/auditController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { attachOrg } from "../middlewares/orgMiddleware.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();


router.get(
    "/audit-logs",
    authenticate,
    attachOrg,
    requireRole(["ADMIN"]),
    getAuditLogs
);


router.get(
    "/projects/:projectId/audit-logs",
    authenticate,
    attachOrg,
    requireRole(["ADMIN"]),
    getProjectAuditLogs
);

export default router;
