// server/utils/auditLogger.js
import pool from '../db/index.js';

export const logAudit = async ({ orgId, userId, action, entity, entityId, details = {} }) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (org_id, user_id, action, entity, entity_id, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orgId, userId, action, entity, entityId, details] 
        );
    } catch (err) {
        console.error("Audit Logging Error:", err);
    }
};