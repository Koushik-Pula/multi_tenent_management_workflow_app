import pool from '../db/index.js';
import { logAudit } from '../utils/auditLogger.js';

import { ensureNotLastAdmin } from '../guards/orgGuards.js';
import { ensureNotLastManager } from '../guards/projectGuards.js';


export const createProject = async(req,res)=> {
    const {name,description} = req.body;
    const orgId = req.orgId;
    const userId = req.user.userId;

    if(!name){
        return  res.status(400).json({message:"Project name is required"});
    }

    const client  = await pool.connect();

    try{
        await client.query('BEGIN');

        const projectResult = await client.query(
            `INSERT INTO projects(org_id,name,description,created_by)
             VALUES($1,$2,$3,$4)
             RETURNING id,name,description,created_at`,
             [orgId,name,description || null,userId]
        );

        const project = projectResult.rows[0];

        await client.query(
            `INSERT INTO project_members(project_id,user_id,role)
             VALUES($1,$2,'MANAGER')`,
             [project.id,userId]
        );

        await logAudit({
            orgId,
            userId,
            action: 'CREATE_PROJECT',
            entity: 'PROJECT',
            entityId: project.id
        });

        await client.query('COMMIT');

        res.status(201).json({project});
    }catch(err){
        await client.query('ROLLBACK');
        console.error('Error creating project:',err);
        res.status(500).json({message:"Internal server error"});
    }finally{
        client.release();
    }
};

export const listProjects = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // We need these from the authenticated user
    const userId = req.user.userId;
    const userRole = req.user.role; 
    const orgId = req.orgId;

    try {
        let query;
        let params;

        if (userRole === 'ADMIN') {
            // --- 1. ADMIN QUERY: Show ALL projects in the Org ---
            query = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.created_at,
                    p.created_by,
                    ud.name AS created_by_name,
                    (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
                FROM projects p
                LEFT JOIN user_details ud ON ud.user_id = p.created_by
                WHERE p.org_id = $1
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [orgId, limit, offset];
        } else {
            // --- 2. MEMBER QUERY: Show ONLY projects they are in ---
            query = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.created_at,
                    p.created_by,
                    ud.name AS created_by_name,
                    (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
                FROM projects p
                -- Join with project_members to filter permissions
                INNER JOIN project_members pm_check ON p.id = pm_check.project_id
                LEFT JOIN user_details ud ON ud.user_id = p.created_by
                WHERE p.org_id = $1 
                  AND pm_check.user_id = $2 -- Only projects where THIS user is a member
                ORDER BY p.created_at DESC
                LIMIT $3 OFFSET $4
            `;
            // Note parameter order: orgId ($1), userId ($2), limit ($3), offset ($4)
            params = [orgId, userId, limit, offset];
        }

        const result = await pool.query(query, params);

        res.json({
            data: result.rows,
            meta: { limit, offset }
        });
    } catch (err) {
        console.error("List Projects Error:", err);
        res.status(500).json({ message: "Failed to list projects" });
    }
};



export const getProjectById = async (req, res) => {
    const result = await pool.query(
        `
        SELECT
            p.*,
            ud.name AS created_by_name
        FROM projects p
        JOIN user_details ud ON ud.user_id = p.created_by
        WHERE p.id = $1
          AND p.org_id = $2
        `,
        [req.params.projectId, req.orgId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "Project not found" });
    }

    res.json(result.rows[0]);
};


export const updateProject = async(req,res) => {
    const orgId = req.orgId;
    const {projectId} = req.params;
    const {name,description} = req.body;

    if(!name && description === undefined){
        return res.status(400).json({
            message: "at least one field is required"
        });
    }

    try{
        const result = await pool.query(
            `UPDATE projects
             SET 
                name = COALESCE($1,name),
                description = COALESCE($2,description)
             WHERE id = $3 AND org_id = $4
             RETURNING id,name,description`,
             [name || null, description || null, projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "project not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: 'UPDATE_PROJECT',
            entity: 'PROJECT',
            entityId: projectId
        });

        res.json({
            message: "project updated",
            project: result.rows[0]
        });
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Failed to update project"});
    }
};

export const archiveProject = async(req,res) => {
    const {projectId} = req.params;
    const orgId = req.orgId;

    try{  
        const result = await pool.query(
            `UPDATE projects
             SET is_archived = true
             WHERE id = $1 AND org_id = $2
             RETURNING id`,
             [projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "project not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: 'ARCHIVE_PROJECT',
            entity: 'PROJECT',
            entityId: projectId
        });

        res.json({message: "Project archived"});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to archive the project"});
    }
};

export const unarchiveProject = async(req,res) => {
    const {projectId} = req.params;
    const orgId = req.orgId;

    try{   
        const result = await pool.query(
            `UPDATE projects
             SET is_archived = false
             WHERE id = $1 AND org_id = $2
             RETURNING id`,
             [projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "project not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: 'UNARCHIVE_PROJECT',
            entity: 'PROJECT',
            entityId: projectId
        });

        res.json({message: "Project unarchived"});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to unarchive the project"});
    }
};

export const addProjectMember = async (req,res) => {
    const orgId = req.orgId;
    const {projectId} = req.params;
    const {userId,role} = req.body;

    if(!userId || !role){
        return res.status(400).json({
            message: "all fields are required"
        });
    }

    if(!['MANAGER','MEMBER'].includes(role)){
        return res.status(400).json({message: "invalid project role"});
    }

    try{  

        const userResult = await pool.query(
            `SELECT id FROM users
             WHERE id = $1 AND org_id = $2 AND is_active = true`,
             [userId,orgId]
        );

        if(userResult.rows.length === 0){
            return res.status(404).json({message: "user not found in the organization"});
        }

        await pool.query(
            `INSERT INTO project_members (project_id,user_id,role)
             VALUES ($1,$2,$3)
             ON CONFLICT (project_id,user_id) DO NOTHING`,
             [projectId,userId,role]
        );

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "ADD_PROJECT_MEMBER",
            entity: "PROJECT_MEMBER",
            entityId: projectId
        });

        res.status(201).json({
            message: "User added to the project"
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Failed to add project member"
        });
    }
};


export const removeProjectMember = async (req,res) => {
    const orgId = req.orgId;
    const {projectId,userId} = req.params;

    try{   
        await ensureNotLastManager(projectId, userId); 
        const userResult = await pool.query(
            `DELETE FROM project_members
             WHERE project_id = $1 AND user_id = $2
             RETURNING id`,
             [projectId,userId]
        );

        if(userResult.rowCount === 0){
            return res.status(404).json({message: "user not found in the organization"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "REMOVE_PROJECT_MEMBER",
            entity: "PROJECT_MEMBER",
            entityId: projectId
        });

        res.status(201).json({
            message: "member removed from the project"
        });
    }catch(err){
        console.error(err);
        
        if (err.message === "CANNOT_REMOVE_LAST_MANAGER") {
            return res.status(400).json({
                message: "Project must have at least one manager"
            });
        }

        res.status(500).json({
            message: "Failed to remove project member"
        });
    }
};

export const listProjectMembers = async (req, res) => {
    const { projectId } = req.params;
    const orgId = req.orgId;
    let { limit = 20, offset = 0 } = req.query;

    limit = Math.min(Number(limit) || 20, 100);
    offset = Number(offset) || 0;

    const result = await pool.query(
        `SELECT u.id, u.email, pm.role, u.is_active
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1 AND u.org_id = $2
         ORDER BY u.created_at DESC
         LIMIT $3 OFFSET $4`,
        [projectId, orgId, limit, offset]
    );

    res.json({
        data: result.rows,
        meta: { limit, offset, count: result.rows.length }
    });
};


export const updateProjectMemberRole = async (req,res) => {
    const {projectId,userId} = req.params;
    const {role} = req.body;

    if(!role || !['MANAGER','MEMBER'].includes(role)){
        return res.status(400).json({message: "valid data is required"});
    }

    try{ 
        if (role === 'MEMBER') {
            await ensureNotLastManager(projectId, userId);
        }

        const result = await pool.query(
            `UPDATE project_members
             SET role = $1
             WHERE project_id = $2 AND user_id = $3
             RETURNING id`,
             [role,projectId,userId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "project member not found"});
        }

        await logAudit({
            orgId: req.orgId,
            userId: req.user.userId,
            action: "UPDATE_PROJECT_MEMBER_ROLE",
            entity: "PROJECT_MEMBER",
            entityId: projectId
        });

        res.json({message: "project member role updated"});
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Failed to update project member role"
        });
    }
};


