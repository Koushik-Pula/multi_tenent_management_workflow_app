import pool from '../db/index.js';

// --- 1. Get Logs for the Widget (Org or Personal) ---
export const getAuditLogs = async (req, res) => {
    const orgId = req.orgId;
    const userId = req.user.userId;
    const userRole = req.user.role; 
    const limit = parseInt(req.query.limit) || 10;

    try {
        let query;
        let params;

        if (userRole === 'ADMIN') {
            query = `
                SELECT 
                    a.id,
                    a.action,
                    a.entity,
                    a.entity_id,
                    a.details,      -- <--- ADDED THIS
                    a.created_at,
                    ud.name as user_name 
                FROM audit_logs a
                LEFT JOIN user_details ud ON a.user_id = ud.user_id
                WHERE a.org_id = $1 
                ORDER BY a.created_at DESC LIMIT $2`;
            params = [orgId, limit];
        } else {
            query = `
                SELECT 
                    a.id,
                    a.action,
                    a.entity,
                    a.entity_id,
                    a.details,      -- <--- ADDED THIS
                    a.created_at,
                    ud.name as user_name 
                FROM audit_logs a
                LEFT JOIN user_details ud ON a.user_id = ud.user_id
                WHERE a.org_id = $1 AND a.user_id = $2
                ORDER BY a.created_at DESC LIMIT $3`;
            params = [orgId, userId, limit];
        }

        const result = await pool.query(query, params);
        res.json({ data: result.rows });
    } catch (err) {
        console.error("Audit Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch logs" });
    }
};

// --- 2. Explicit Endpoint for "My Activity" (If you prefer the separate route) ---
export const getMyAuditLogs = async (req, res) => {
    const userId = req.user.userId;
    const orgId = req.orgId;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const result = await pool.query(
            `SELECT 
                a.id,
                a.action, 
                a.entity, 
                a.entity_id, 
                a.details,       -- <--- ADDED THIS
                a.created_at,
                ud.name as user_name
             FROM audit_logs a
             LEFT JOIN user_details ud ON a.user_id = ud.user_id
             WHERE a.user_id = $1 AND a.org_id = $2
             ORDER BY a.created_at DESC 
             LIMIT $3`,
            [userId, orgId, limit]
        );

        res.json({ data: result.rows });
    } catch (err) {
        console.error("Personal Audit Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch your activity logs" });
    }
};


export const getProjectAuditLogs = async (req, res) => {
    const { projectId } = req.params;
    const orgId = req.orgId;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const result = await pool.query(
            `SELECT 
                a.id,
                a.action,
                a.entity,
                a.entity_id,
                a.details,      -- <--- Don't forget this!
                a.created_at,
                ud.name as user_name 
             FROM audit_logs a
             LEFT JOIN user_details ud ON a.user_id = ud.user_id
             JOIN audit_logs a2 ON a.id = a2.id -- Verify project association via join if needed, or check logs directly
             WHERE a.org_id = $1 
               AND a.details->>'project_id' = $2 -- Option A: If you store project_id in details
               -- OR Option B: If your audit_logs table has a project_id column (Recommended for simpler queries)
               -- AND a.project_id = $2 
             ORDER BY a.created_at DESC LIMIT $3`,
            [orgId, projectId, limit]
        );
        
  
        
        res.json({ data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch project logs" });
    }
};