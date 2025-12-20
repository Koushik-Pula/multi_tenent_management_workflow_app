import pool from '../db/index.js';

export const requireAdminOrProjectRole = (projectRoles) => {
    return async (req, res, next) => {
        const {projectId} = req.params;
        const user = req.user;

        if(user.role === 'ADMIN'){
            return next();
        }

        try{
            const result = await pool.query(
                `SELECT role FROM project_members
                 WHERE project_id = $1 AND user_id = $2`,
                 [projectId,user.userId]
            );

            if(result.rows.length === 0){
                return res.status(403).json({message: 'Access denied. Not a project member.'});
            }

            const projectRole = result.rows[0].role;

            if(!projectRoles.includes(projectRole)){
                return res.status(403).json({
                    message: 'Insufficient project permissions'
                });
            }

            req.projectRole = projectRole;
            next();
        }catch(err){
            console.error(err);
            res.status(500).json({message: 'Project authorization failed'});
        }
    };
}; 