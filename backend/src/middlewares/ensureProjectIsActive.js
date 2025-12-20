import pool from "../db/index.js";

export const ensureProjectIsActive = async (req, res, next) => {
    const { projectId } = req.params;

    const result = await pool.query(
        `SELECT is_archived FROM projects WHERE id = $1`,
        [projectId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
    }

    if (result.rows[0].is_archived) {
        return res.status(403).json({
            message: "Archived projects are read-only"
        });
    }

    next();
};
