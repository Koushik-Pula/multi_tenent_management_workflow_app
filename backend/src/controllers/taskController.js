import pool from '../db/index.js';
import { logAudit } from '../utils/auditLogger.js';

import { isValidTaskTransition } from '../workflows/taskworkflow.js';

export const createTask = async (req, res) => {
    const orgId = req.orgId;
    const { projectId } = req.params;
    const { title, description, priority, due_date, assigned_to } = req.body; 

    try {
        const result = await pool.query(
            `
            INSERT INTO tasks (
                org_id, project_id, title, description, priority, due_date, created_by, assigned_to
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, title, status, priority, due_date, created_at, assigned_to
            `,
            [
                orgId, projectId, title, 
                description || null, priority || 3, due_date || null, 
                req.user.userId, assigned_to || null
            ]
        );

        // --- FIX IS HERE ---
        // 'taskId' does not exist in this function. You must use 'result.rows[0].id'
        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "CREATE_TASK",
            entity: "TASK",
            entityId: result.rows[0].id, // <--- CHANGED FROM taskId TO result.rows[0].id
            details: { title: result.rows[0].title }
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Task Creation Error:", err);
        res.status(500).json({ message: "Failed to create task" });
    }
};


export const listTasks = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const result = await pool.query(
            `
            SELECT
                t.id,
                t.title,
                t.status,
                t.created_at,
                t.assigned_to,
                t.description,
                t.priority,
                t.due_date,

                assignee.name AS assigned_to_name,
                creator.name AS created_by_name
            FROM tasks t
            LEFT JOIN user_details assignee ON assignee.user_id = t.assigned_to
            LEFT JOIN user_details creator ON creator.user_id = t.created_by
            WHERE t.project_id = $1
            ORDER BY t.created_at DESC
            LIMIT $2 OFFSET $3
            `,
            [req.params.projectId, limit, offset]
        );

        res.json({
            data: result.rows,
            meta: { limit, offset }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to list tasks" });
    }
};



export const getTaskById = async (req, res) => {
    const result = await pool.query(
        `
        SELECT
            t.*,
            assignee.name AS assigned_to_name,
            creator.name AS created_by_name
        FROM tasks t
        LEFT JOIN user_details assignee
            ON assignee.user_id = t.assigned_to
        JOIN user_details creator
            ON creator.user_id = t.created_by
        WHERE t.id = $1
        `,
        [req.params.taskId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.json(result.rows[0]);
};


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
            `SELECT status,title FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
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
            entityId: taskId,
            details: { title: task.rows[0].title }
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
            `SELECT status,title FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
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
            entityId: taskId,
            details: { title: task.rows[0].title }
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
            `SELECT status,assigned_to,title FROM tasks
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
            entityId: taskId,
            details: { title: taskResult.rows[0].title }
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
            entityId: taskId,
            details: { title: result.rows[0].title }
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
        // 1. GET THE TITLE BEFORE DELETING (Important!)
        const taskCheck = await pool.query(
            `SELECT title, status FROM tasks WHERE id = $1 AND project_id = $2 AND org_id = $3`,
            [taskId, projectId, orgId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ message: "task not found" });
        }

        const taskTitle = taskCheck.rows[0].title;

        if (taskCheck.rows[0].status === "DONE") {
            return res.status(400).json({ message: "Completed tasks cannot be modified" });
        }

        // 2. DELETE THE TASK
        await pool.query(
            `DELETE FROM tasks
             WHERE id = $1 AND project_id = $2 AND org_id = $3`,
             [taskId,projectId,orgId]
        );

        // 3. LOG AUDIT WITH THE SAVED TITLE
        await logAudit({
            orgId,
            userId: req.user.userId,
            action: "DELETE_TASK",
            entity: "TASK",
            entityId: taskId,
            details: { title: taskTitle } // <--- This saves the name forever
        });

        res.json({message: "task deleted successfully"});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to delete task"});
    }
};

export const getMyTasks = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT 
                t.*, 
                p.name as project_name 
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.assigned_to = $1 
             AND p.is_archived = false
             ORDER BY t.due_date ASC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch your tasks" });
    }
};