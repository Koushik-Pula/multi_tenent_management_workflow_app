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

export const acceptInvite = async (req,res) =>{
    const {token,password} = req.body;

    if(!token || !password){
        return res.status(400).json({message: 'Token and password are required'});
    }

    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const inviteResult = await client.query(
            `SELECT id,org_id,email,role,expires_at,accepted_at
             FROM invites
             WHERE token = $1`,
             [token]
        )

        if(inviteResult.rows.length === 0){
            await client.query('ROLLBACK');
            return res.status(400).json({message: "invalid invite token"});
        }

        const invite = inviteResult.rows[0];

        if(invite.accepted_at){
            await client.query('ROLLBACK');
            return res.status(400).json({message: "invite already used"});
        }

        if(new Date(invite.expires_at) < new Date()){
            await client.query('ROLLBACK');
            return res.status(400).json({message: "invite token expired"});
        }


        const existingUser = await client.query(
            `SELECT id FROM users WHERE email = $1`,
            [invite.email]
        );
        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "User already exists" });
        }

        const passwordHash = await bcrypt.hash(password,10);


        await client.query(
            `INSERT INTO users(org_id,email,password_hash,role)
             VALUES($1,$2,$3,$4)`,
             [invite.org_id,invite.email,passwordHash,invite.role]
        )

        await client.query(
            `UPDATE invites
             SET accepted_at = NOW()
             WHERE id = $1`,
             [invite.id]
        )

        await client.query('COMMIT');
        res.status(201).json({message: 'Invite accepted and user created successfully'});
    }catch (err){
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({message: 'Failed to accept invite'});
    }finally{
        client.release();
    }
};

export const listUsers = async (req,res) => {
    const orgId = req.orgId;
    try{
        const userList = await pool.query(
            `SELECT id,email,role,is_active,created_at FROM users
             WHERE org_id = $1
             ORDER BY created_at ASC`,
             [orgId]
        );
        res.json(userList.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "failed to fetch users"});
    }
};

export const updateUserRole = async(req,res) => {
    const orgId = req.orgId;
    const {userId} = req.params;
    const {role} = req.body;
    const currentUserId = req.user.userId;

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
        await ensureNotLastAdmin(orgId,UserId);
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