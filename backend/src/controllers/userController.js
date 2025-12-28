import pool from '../db/index.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ensureNotLastAdmin } from '../guards/orgGuards.js';



export const createInvite = async (req,res)=>{

    const {email,role} = req.body;
    const orgId = req.orgId;

    if(!email || !role){
        return res.status(400).json({message:"email and role are required"});
    }
    if(!["ADMIN","MEMBER"].includes(role)){
        return res.status(400).json({message:"invalid role"});
    }

    try{
        const userResult = await pool.query(
            `SELECT id FROM users WHERE email=$1`,
            [email]
        )
        if(userResult.rows.length > 0){
            return res.status(409).json({message:"User with this email already exists"});
        }

        const inviteResult = await pool.query(
            `SELECT id FROM invites
             WHERE email = $1
             AND org_id = $2
             AND accepted_at is NULL
             AND expires_at > NOW()`,
             [email,orgId]
        )
        if(inviteResult.rows.length > 0){
            return res.status(409).json({message: "Invite already sent"});
        }

        const token = crypto.randomBytes(32).toString("hex");

        await pool.query(
            `INSERT INTO invites(org_id,email,role,token,expires_at)
             VALUES($1,$2,$3,$4,NOW() + INTERVAL '48 hours')`,
             [orgId,email,role,token]
        )

        const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

        res.status(201).json({message: 'Invite created successfully', inviteLink});
    }catch(err){
        console.error(err);
        res.status(500).json({message: 'Failed to create invite'});
    }
};

export const acceptInvite = async (req, res) => {
    // ... (Keep your existing acceptInvite code) ...
    const { token, password } = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const inviteRes = await client.query(
            `
            SELECT *
            FROM invites
            WHERE token = $1
              AND used = false
              AND expires_at > NOW()
            `,
            [token]
        );

        if (inviteRes.rowCount === 0) {
            throw new Error("Invalid or expired invite");
        }

        const invite = inviteRes.rows[0];

        const passwordHash = await bcrypt.hash(password, 10);

        const userInsert = await client.query(
            `
            INSERT INTO users (org_id, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [invite.org_id, invite.email, passwordHash, invite.role]
        );

        const userId = userInsert.rows[0].id;
        const defaultName = invite.email.split("@")[0];

        await client.query(
            `
            INSERT INTO user_details (user_id, name)
            VALUES ($1, $2)
            `,
            [userId, defaultName]
        );

        await client.query(
            `
            UPDATE invites
            SET used = true
            WHERE id = $1
            `,
            [invite.id]
        );

        await client.query("COMMIT");

        res.json({ message: "Invite accepted successfully" });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(400).json({ message: err.message });
    } finally {
        client.release();
    }
};

export const listUsers = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const orgId = req.orgId;

    const result = await pool.query(
        `
        SELECT
            u.id,
            u.email,
            u.role,
            u.is_active,
            d.name,
            d.avatar_url  -- <--- ADD THIS LINE
        FROM users u
        LEFT JOIN user_details d ON d.user_id = u.id
        WHERE u.org_id = $1
        ORDER BY d.name
        LIMIT $2 OFFSET $3
        `,
        [orgId, limit, offset]
    );

    res.json({
        data: result.rows,
        meta: { limit, offset }
    });
};

export const updateUserRole = async(req,res) => {
    const orgId = req.orgId;
    const {userId} = req.params;
    const {role} = req.body;
    const currentUserId = req.user.userId; // FIXED: Ensure this matches token

    if(!role){
        return res.status(400).json({message: "role is required"});
    }

    if(!["ADMIN","MEMBER"].includes(role)){
        return res.status(400).json({message: "invalid role"});
    }

    if(userId === currentUserId){
        return res.status(400).json({message:"you cannot change your own role"});
    }

    try{
        await ensureNotLastAdmin(orgId,userId);
        const result = await pool.query(
            `UPDATE users
             SET role = $1
             WHERE id = $2 AND org_id = $3
             RETURNING id,email,role`,
             [role,userId,orgId]
        )
        if(result.rows.length === 0){
            return res.status(404).json({message: "User not found in this organization"});
        }
        res.json({
            message: "user role changed successfully",
            user: result.rows[0]
        });
    }catch(err){
        console.error(err);
        res.status(500).json({message:"failed to update user role"});
    }
};

export const deactivateUser = async(req,res) =>{
    const {userId} = req.params;
    const orgId = req.orgId;
    const currentUserId = req.user.userId;

    if(userId === currentUserId){
        return res.status(400).json({
            message: "you cannot deactivate yourself"
        });
    }

    try{
        await ensureNotLastAdmin(orgId,userId);
        const result = await pool.query(
            `UPDATE users
             SET is_active = false
             WHERE id = $1 AND org_id = $2
             RETURNING id,email,is_active`,
             [userId,orgId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({
                message: "user not found in this organization"
            });
        }

        res.json({
            message:"user deactivated",
            user: result.rows[0]
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "failed to deactivate user"
        });
    }
};

export const reactivateUser = async(req,res) =>{
    const {userId} = req.params;
    const orgId = req.orgId;
    const currentUserId = req.user.userId;

    if(userId === currentUserId){
        return res.status(400).json({
            message: "you cannot reactivate yourself"
        });
    }

    try{
        const result = await pool.query(
            `UPDATE users
             SET is_active = true
             WHERE id = $1 AND org_id = $2
             RETURNING id,email,is_active`,
             [userId,orgId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({
                message: "user not found in this organization"
            });
        }

        res.json({
            message:"user reactivated",
            user: result.rows[0]
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "failed to reactivate user"
        });
    }
}

export const getMyProfile = async (req, res) => {
    const result = await pool.query(
        `
        SELECT
            name,
            avatar_url,
            job_title,
            timezone
        FROM user_details
        WHERE user_id = $1
        `,
        [req.user.userId] 
    );

    res.json(result.rows[0]);
};

export const updateMyProfile = async (req, res) => {
    const { name, avatar_url, job_title, timezone } = req.body;

    await pool.query(
        `
        UPDATE user_details
        SET
            name = COALESCE($1, name),
            avatar_url = COALESCE($2, avatar_url),
            job_title = COALESCE($3, job_title),
            timezone = COALESCE($4, timezone)
        WHERE user_id = $5
        `,
        [name, avatar_url, job_title, timezone, req.user.userId] 
    );

    res.json({ message: "Profile updated" });
};

export const getDashboardStats = async (req, res) => {
    const orgId = req.orgId;

    try {
        // 1. Count ALL users in the Organization
        const usersRes = await pool.query(
            `SELECT COUNT(*) FROM users WHERE org_id = $1`, 
            [orgId]
        );

        // 2. Count Projects
        const projectsRes = await pool.query(
            `SELECT COUNT(*) FROM projects WHERE org_id = $1`, 
            [orgId]
        );

        // 3. Count Active Tasks (Optional)
        const tasksRes = await pool.query(
            `SELECT COUNT(*) FROM tasks WHERE org_id = $1 AND status != 'DONE'`, 
            [orgId]
        );

        res.json({
            employees: parseInt(usersRes.rows[0].count),
            projects: parseInt(projectsRes.rows[0].count),
            activeTasks: parseInt(tasksRes.rows[0].count)
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};