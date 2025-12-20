import pool from '../db/index.js';

export const ensureNotLastAdmin = async(orgId,userId) => {
    const result = await pool.query(
        `SELECT COUNT(*) FROM users
         WHERE org_id = $1 AND role = 'ADMIN' AND is_active = true`,
         [orgId]
    );

    const adminCount = Number(result.rows[0].count);

    if(adminCount == 1){
        const lastAdmin = await pool.query(
            `SELECT id FROM users
             WHERE org_id = $1 AND role = 'ADMIN' AND is_active = true`,
             [orgId]
        );

        if(lastAdmin.rows[0].id === userId){
            throw new Error("CANT_REMOVE_LAST_ADMIN");
        }
    }
}