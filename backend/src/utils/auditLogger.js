import pool from '../db/index.js';

export const logAudit = async({
    orgId,
    userId,
    action,
    entity,
    entityId,
}) => {
    await pool.query(
        `INSERT INTO audit_logs (org_id,user_id,action,entity,entity_id)
         VALUES ($1,$2,$3,$4,$5)`,
         [orgId,userId,action,entity,entityId]
    );
};