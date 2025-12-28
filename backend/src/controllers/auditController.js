import pool from '../db/index.js';

export const getAuditLogs = async (req, res) => {
    const orgId = req.orgId;

    let {
        entity,
        action,
        userId,
        startDate,
        endDate,
        limit = 20,
        offset = 0
    } = req.query;

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safeOffset = Number(offset) || 0;

    try {
        const conditions = ["a.org_id = $1"];
        const values = [orgId];
        let idx = 2;

        if (entity) {
            conditions.push(`a.entity = $${idx++}`);
            values.push(entity);
        }

        if (action) {
            conditions.push(`a.action = $${idx++}`);
            values.push(action);
        }

        if (userId) {
            conditions.push(`a.user_id = $${idx++}`);
            values.push(userId);
        }

        if (startDate) {
            conditions.push(`a.created_at >= $${idx++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`a.created_at <= $${idx++}`);
            values.push(endDate);
        }

        const query = `
            SELECT
                a.id,
                a.user_id,
                ud.name AS user_name,
                a.action,
                a.entity,
                a.entity_id,
                a.created_at
            FROM audit_logs a
            JOIN user_details ud ON ud.user_id = a.user_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY a.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;

        values.push(safeLimit, safeOffset);

        const result = await pool.query(query, values);

        res.json({
            data: result.rows,
            meta: {
                limit: safeLimit,
                offset: safeOffset,
                count: result.rows.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
};





export const getProjectAuditLogs = async (req, res) => {
    const { projectId } = req.params;
    const orgId = req.orgId;

    let { limit = 20, offset = 0 } = req.query;

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safeOffset = Number(offset) || 0;

    try {
        const result = await pool.query(
            `
            SELECT
                a.id,
                a.user_id,
                ud.name AS user_name,
                a.action,
                a.entity,
                a.entity_id,
                a.created_at
            FROM audit_logs a
            JOIN user_details ud ON ud.user_id = a.user_id
            WHERE a.org_id = $1
              AND a.entity = 'PROJECT'
              AND a.entity_id = $2
            ORDER BY a.created_at DESC
            LIMIT $3 OFFSET $4
            `,
            [orgId, projectId, safeLimit, safeOffset]
        );

        res.json({
            data: result.rows,
            meta: {
                limit: safeLimit,
                offset: safeOffset,
                count: result.rows.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch project audit logs" });
    }
};


