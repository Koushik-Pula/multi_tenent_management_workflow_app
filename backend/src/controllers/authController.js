import pool from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signup = async (req,res) => {
    const {orgName,adminEmail,password} =  req.body;
    if(!orgName || !adminEmail || !password){
        return  res.status(400).json({message: 'All fields are required'});
    }
    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const slug = orgName.toLowerCase().replace(/\s+/g, '-');

        const orgResult = await client.query(
            `INSERT INTO organizations(name,slug)
             VALUES($1,$2)
             RETURNING id`,
             [orgName,slug]
        );

        const orgId = orgResult.rows[0].id;

        const hashedPassword = await bcrypt.hash(password,10);

        await client.query(
            `INSERT INTO users(org_id,email,password_hash,role)
             VALUES($1,$2,$3,'ADMIN')
             RETURNING id`,
             [orgId,adminEmail,hashedPassword]
        );

        await client.query('COMMIT');
        res.status(200).json({message: 'Organization and admin user created successfully'});
    }catch (err){
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({error:"signup failed"});
    }finally{
        client.release();
    }
};

export const login = async (req,res) =>{
    const {email,password} = req.body;
    if(!email || !password){
        return res.status(400).json({message: 'Email and password are required'});
    }

    try{
        const userResult = await pool.query(
            `SELECT id,org_id,email,password_hash,role FROM users 
             WHERE email = $1 AND is_active = true`,
            [email]
        )


        if(userResult.rows.length === 0 ){
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const user = userResult.rows[0];

        if(!(await bcrypt.compare(password,userResult.rows[0].password_hash))){
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const accessToken = jwt.sign(
            {
                userId : user.id,
                orgId : user.org_id,
                role : user.role
            },
            process.env.JWT_ACCESS_SECRET,
            {expiresIn : process.env.ACCESS_TOKEN_EXPIRES_IN}
        );

        const refreshToken = jwt.sign(
            {
                userId : user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {expiresIn : process.env.REFRESH_TOKEN_EXPIRES_IN}
        )

        await pool.query(
            `INSERT INTO refresh_tokens(user_id,token,expires_at)
             VALUES($1,$2,NOW() + INTERVAL '7 days')`,
             [user.id,refreshToken]
        )

        res.json({
            accessToken,
            refreshToken
        });
    }catch (err){
        console.error(err);
        res.status(500).json({error: 'login failed'});
    }
}

export const refresh = async(req,res) => {
    const {refreshToken} = req.body;
    if(!refreshToken){
        return res.status(401).json({message: 'Refresh token is required'});
    }

    try{
        const decode = jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);

        const tokenResult = await pool.query(
            `SELECT id,user_id,token,expires_at FROM refresh_tokens
             WHERE token = $1 AND expires_at > NOW()`,
            [refreshToken]
        )
        if(tokenResult.rows.length === 0){
            return res.status(401).json({message: 'Invalid refresh token'});
        }

        const tokenRow = tokenResult.rows[0];

        const userResult = await pool.query(
            `SELECT id,org_id,role FROM users
             WHERE id = $1 AND is_active = true`,
             [decode.userId]
        )
        if(userResult.rows.length === 0){
            return res.status(401).json({message: 'User not found'});
        }
        const user = userResult.rows[0];

        await pool.query(
            `DELETE FROM refresh_tokens
             WHERE id = $1`,
             [tokenRow.id]
        );

        const newAccessToken = jwt.sign(
            {
                userId: user.id,
                orgId: user.org_id,
                role: user.role
            },
            process.env.JWT_ACCESS_SECRET,
            {expiresIn : process.env.ACCESS_TOKEN_EXPIRES_IN}
        );

        const newRefreshToken = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {expiresIn : process.env.REFRESH_TOKEN_EXPIRES_IN}
        )

        await pool.query(
            `INSERT INTO refresh_tokens(user_id,token,expires_at)
             VALUES($1,$2, NOW() + INTERVAL '7 days')`,
             [user.id,newRefreshToken]
        )

        res.json({
            accessToken : newAccessToken,
            refreshToken : newRefreshToken
        });
    }catch (err){
        console.error(err);
        res.status(401).json({error: 'Could not refresh access token'});
    }
};

export const logout = async (req,res) => {
    const {refreshToken} = req.body;
    if(!refreshToken){
        return res.status(400).json({message: 'Refresh token is required'});
    }

    try{
        await pool.query(
            `DELETE FROM refresh_tokens
             WHERE token = $1`,
             [refreshToken]
        );

        res.json({message: 'Logged out successfully'});
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Logout failed'});
    }
};