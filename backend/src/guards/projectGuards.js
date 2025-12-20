import pool from "../db/index.js";

export const ensureNotLastManager = async (projectId, userId) => {
    const result = await pool.query(
        `SELECT COUNT(*) FROM project_members
         WHERE project_id = $1 AND role = 'MANAGER'`,
        [projectId]
    );

    const managerCount = Number(result.rows[0].count);

    if (managerCount === 1) {
        const lastManager = await pool.query(
            `SELECT user_id FROM project_members
             WHERE project_id = $1 AND role = 'MANAGER'`,
            [projectId]
        );

        if (lastManager.rows[0].user_id === userId) {
            throw new Error("CANNOT_REMOVE_LAST_MANAGER");
        }
    }
};
