import pool from '../db/index.js';

export const requireProjectRole = (roles) =>{
    return async (req,res,next)=>{
        const {projectId} = req.params;
        const userId = req.user.userId;

        if(!projectId){
            return res.status(400).json({message: "project id is required"});
        }

        try{
            const result = await pool.query(
                `SELECT role 
                 FROM project_members
                 WHERE project_id = $1 AND user_id = $2`,
                 [projectId,userId]
            );

            if(result.rows.length === 0){
                return res.status(403).json({message: "you are not a member of this project"});
            }

            projectRole = result.rows[0].role;

            if(!roles.includes(projectRole)){
                return res.status(403).json({
                    message: "access denied"
                });
            }

            req.projectRole = projectRole;
            next();
        }catch(err){
            console.error(err);
            res.status(500).json({message: "project authorization failed"});        }
    }
}