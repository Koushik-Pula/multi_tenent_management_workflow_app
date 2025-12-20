import pool from '../db/index.js';
import { logAudit } from '../utils/auditLogger.js';

import { isValidTaskTransition } from '../workflows/taskworkflow.js';

export const createTask = async(req,res) => {
    const {projectId} = req.params;
    const orgId = req.orgId;
    const {title,description,priority,due_date} = req.body;

    if(!title){
        return res.status(400).json({message: "title is required"});
    }

    try{  

        const result = await pool.query(
            `INSERT INTO tasks (org_id,project_id,title,description,priority,due_date)
             VALUES($1,$2,$3,$4,$5,$6)
             RETURNING id,title,status,priority,due_date,created_at`,
             [orgId,projectId,title,description || null,priority || 3,due_date || null]
        )

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "CREATE_TASK",
            entity: "TASK",
            entityId: result.rows[0].id
        });

        res.status(201).json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Failed to create task"
        });
    }
};

export const listTasks = async (req,res) => {
    const {projectId} = req.params;
    const orgId = req.orgId;

    try{
        const result = await pool.query(
            `SELECT id,title,status,priority,assigned_to,due_date,created_at
             FROM tasks
             WHERE org_id = $1 AND project_id = $2
             ORDER BY created_at DESC`,
             [orgId,projectId]
        );

        res.json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to fetch tasks"});
    }
}

export const getTaskById = async(req,res) => {
    const {projectId,taskId} = req.params;
    const orgId = req.orgId;

    try{
        const result = await pool.query(
            `SELECT id,title,description,status,priority,assigned_to,due_date,created_at
             FROM tasks
             WHERE id = $1 AND project_id = $2 AND org_id = $3`,
             [taskId,projectId,orgId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({message: "task not found"});
        }

        res.json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to fetch tasks"});
    }
}

export const assignTask = async(req,res) => {
    const {projectId,taskId} = req.params;
    const {userId} = req.body;
    const orgId = req.orgId;

    if(!userId){
        return res.status(400).json({
            message: "userId is required"
        });
    }

    try{

        const task = await pool.query(
            `SELECT status FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
            [taskId, projectId, orgId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ message: "task not found" });
        }

        if (task.rows[0].status === "DONE") {
            return res.status(400).json({
                message: "Completed tasks cannot be modified"
            });
        }

        
        const userResult = await pool.query(
            `SELECT id FROM users
             WHERE id = $1 AND org_id = $2 AND is_active = true`,
             [userId,orgId]
        );

        if(userResult.rows.length === 0){
            return res.status(404).json({message: "user not found"});
        }

        const membership = await pool.query(
            `SELECT 1 FROM project_members
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );

        if (membership.rows.length === 0) {
            return res.status(400).json({
                message: "User is not a member of this project"
            });
        }


        const result = await pool.query(
            `UPDATE tasks
             SET assigned_to = $1
             WHERE id = $2 AND project_id = $3 AND org_id = $4
             RETURNING id,assigned_to`,
             [userId,taskId,projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "task not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "ASSIGN_TASK",
            entity: "TASK",
            entityId: taskId
        });


        res.json({message: "task assigned successfully", result: result.rows[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to assign task"});
    }
};

export const unassignTask = async(req,res) => {
    const {projectId,taskId} = req.params;
    const orgId = req.orgId;

    try{
        const task = await pool.query(
            `SELECT status FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
            [taskId, projectId, orgId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ message: "task not found" });
        }

        if (task.rows[0].status === "DONE") {
            return res.status(400).json({
                message: "Completed tasks cannot be modified"
            });
        }
        
        const result = await pool.query(
            `UPDATE tasks
             SET assigned_to = NULL
             WHERE id = $1 AND project_id = $2 AND org_id = $3
             RETURNING id,assigned_to`,
             [taskId,projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "task not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "UNASSIGN_TASK",
            entity: "TASK",
            entityId: taskId
        });


        res.json({message: "task unassigned successfully", result: result.rows[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to unassign task"});
    }
};

export const updateTaskStatus = async(req,res) => {
    const {projectId,taskId} = req.params;
    const {status} = req.body;
    const orgId = req.orgId;
    const userId = req.user.userId;

    if(!status){
        return res.status(400).json({message: "status is required"});
    }

    if (!['TODO','IN_PROGRESS','DONE'].includes(status)) {
       return res.status(400).json({ message: 'Invalid status' });
    }

    try{
    
        const taskResult = await pool.query(
            `SELECT status,assigned_to FROM tasks
             WHERE id = $1 AND project_id = $2 AND org_id = $3`,
             [taskId,projectId,orgId]
        );

        if(taskResult.rows.length === 0){
            return res.status(404).json({message: "task not found"});
        }

        const assignedTo = taskResult.rows[0].assigned_to;
        const currentStatus = taskResult.rows[0].status;

        if (currentStatus === "DONE") {
            return res.status(400).json({
                message: "Completed tasks cannot be modified"
            });
        }

        if (!isValidTaskTransition(currentStatus, status)) {
            return res.status(400).json({
                message: `Invalid status transition from ${currentStatus} to ${status}`
            });
        }

        if(req.projectRole === 'MEMBER' && assignedTo !== userId){
            return res.status(403).json({message: "forbidden: you can update only your assigned tasks"});
        }

        await pool.query(
            `UPDATE tasks
             SET status = $1
             WHERE id = $2 AND project_id = $3 AND org_id = $4`,
             [status,taskId,projectId,orgId]
        );

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "UPDATE_TASK_STATUS",
            entity: "TASK",
            entityId: taskId
        });

        res.json({message: "task status updated successfully"});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to update task status"});
    }
};

export const updateTask = async(req,res) => {
    const {projectId,taskId} = req.params;
    const {title,description,priority,due_date} = req.body;
    const orgId = req.orgId;

    if(!title && description === undefined && priority === undefined && due_date === undefined){
        return res.status(400).json({message: "at least one field is required to update"});
    }

    try{
        const task = await pool.query(
            `SELECT status FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
            [taskId, projectId, orgId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ message: "task not found" });
        }

        if (task.rows[0].status === "DONE") {
            return res.status(400).json({
                message: "Completed tasks cannot be modified"
            });
        }
        
        const result = await pool.query(
            `UPDATE tasks
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 priority = COALESCE($3, priority),
                 due_date = COALESCE($4, due_date)
             WHERE id = $5 AND project_id = $6 AND org_id = $7
             RETURNING id,title,description,priority,due_date`,
             [title || null,description || null,priority || null,due_date || null,taskId,projectId,orgId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({message: "task not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "UPDATE_TASK",
            entity: "TASK",
            entityId: taskId
        });

        res.json({message:"task updated successfully",result:result.rows[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to update task"});
    }
};

export const deleteTask = async(req,res) => {
    const {projectId,taskId} = req.params;
    const orgId = req.orgId;

    try{
        const task = await pool.query(
            `SELECT status FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
            [taskId, projectId, orgId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ message: "task not found" });
        }

        if (task.rows[0].status === "DONE") {
            return res.status(400).json({
                message: "Completed tasks cannot be modified"
            });
        }

        const result = await pool.query(
            `DELETE FROM tasks
             WHERE id = $1 AND project_id = $2 AND org_id = $3
             RETURNING id`,
             [taskId,projectId,orgId]
        );

        if(result.rowCount === 0){
            return res.status(404).json({message: "task not found"});
        }

        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "DELETE_TASK",
            entity: "TASK",
            entityId: taskId
        });


        res.json({message: "task deleted successfully"});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to delete task"});
    }
}