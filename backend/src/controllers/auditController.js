import pool from '../db/index.js';

export const getAuditLogs = async(req,res) => {
    const orgId = req.orgId;

    const {
        entity,
        action,
        userId,
        startDate,
        endDate,
        limit = 20,
        offset = 0,
    } = req.query;

    try{
        const conditions = ["org_id = $1"];
        const values = {orgId};
        let idx = 2;

        if(entity){
            conditions.push("entity = $${idx++}");
            values.push(entity);
        }

        if (action) {
            conditions.push(`action = $${idx++}`);
            values.push(action);
        }

        if (userId) {
            conditions.push(`user_id = $${idx++}`);
            values.push(userId);
        }

        if (startDate) {
            conditions.push(`created_at >= $${idx++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`created_at <= $${idx++}`);
            values.push(endDate);
        }

        const query = `
            SELECT id, user_id, action, entity, entity_id, created_at
            FROM audit_logs
            WHERE ${conditions.join(" AND ")}
            ORDER BY created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;

        values.push(limit, offset);

        const result = await pool.query(query, values);

        res.json({
            data: result.rows,
            meta: {
                limit: Number(limit),
                offset: Number(offset),
                count: result.rows.length
            }
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "failed to fetch audit logs"
        });
    }
};


export const getProjectAuditLogs = async (req, res) => {
    const { projectId } = req.params;
    const orgId = req.orgId;

    const { limit = 20, offset = 0 } = req.query;

    try {
        const result = await pool.query(
            `SELECT id, user_id, action, entity, entity_id, created_at
             FROM audit_logs
             WHERE org_id = $1 AND entity_id = $2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [orgId, projectId, limit, offset]
        );

        res.json({
            data: result.rows,
            meta: {
                limit: Number(limit),
                offset: Number(offset),
                count: result.rows.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to fetch project audit logs"
        });
    }
};
