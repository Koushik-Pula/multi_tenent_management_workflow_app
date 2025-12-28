import pool from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signup = async (req, res) => {
    const { orgName, adminEmail, password } = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const hashedPassword = await bcrypt.hash(password, 10);

        const orgRes = await client.query(
            `
            INSERT INTO organizations (name)
            VALUES ($1)
            RETURNING id
            `,
            [orgName]
        );

        const orgId = orgRes.rows[0].id;

        const userRes = await client.query(
            `
            INSERT INTO users (org_id, email, password_hash, role)
            VALUES ($1, $2, $3, 'ADMIN')
            RETURNING id
            `,
            [orgId, adminEmail, hashedPassword]
        );

        const adminUserId = userRes.rows[0].id;
        const defaultName = adminEmail.split("@")[0];

        await client.query(
            `
            INSERT INTO user_details (user_id, name)
            VALUES ($1, $2)
            `,
            [adminUserId, defaultName]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Organization and admin created successfully"
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Signup failed" });
    } finally {
        client.release();
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Fetch user
        const result = await pool.query(
            `SELECT u.id, u.email, u.password_hash, u.role, u.org_id, u.is_active, d.name, d.avatar_url
             FROM users u
             LEFT JOIN user_details d ON u.id = d.user_id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ message: "Account is deactivated." });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // --- MAINTENANCE: Delete ONLY expired tokens ---
        await pool.query(
            "DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()",
            [user.id]
        );

        // Generate Tokens
        const accessToken = jwt.sign(
            { userId: user.id, orgId: user.org_id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
        );

        // Insert NEW Refresh Token
        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [user.id, refreshToken]
        );

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                orgId: user.org_id,
                avatar: user.avatar_url
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        // 1. Verify the token signature
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // 2. Check if this specific token exists in DB (and isn't expired)
        const tokenResult = await pool.query(
            `SELECT id, user_id FROM refresh_tokens
             WHERE token = $1 AND expires_at > NOW()`,
            [refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const oldTokenId = tokenResult.rows[0].id;
        const userId = tokenResult.rows[0].user_id;

        // 3. Fetch User Details for the new Access Token payload
        const userResult = await pool.query(
            `SELECT id, org_id, role, email FROM users WHERE id = $1 AND is_active = true`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // --- ROTATION STEP ---
        // 4. Delete the OLD refresh token (Single Use)
        await pool.query("DELETE FROM refresh_tokens WHERE id = $1", [oldTokenId]);

        // 5. Generate NEW Pair
        const newAccessToken = jwt.sign(
            { userId: user.id, orgId: user.org_id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
        );

        // 6. Save NEW Refresh Token
        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [user.id, newRefreshToken]
        );

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        console.error("Refresh Error:", err);
        return res.status(403).json({ message: "Invalid Token" });
    }
};

export const me = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.email,
                u.role,
                u.org_id,
                d.name,
                d.avatar_url,
                d.job_title,
                d.timezone,
                o.name as org_name
            FROM users u
            LEFT JOIN user_details d ON d.user_id = u.id
            JOIN organizations o ON u.org_id = o.id
            WHERE u.id = $1
            `,
            [req.user.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "User profile not found"
            });
        }

        const user = result.rows[0];

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            orgId: user.org_id,
            org_name: user.org_name, 
            name: user.name || "",
            avatar_url: user.avatar_url || "",
            job_title: user.job_title || "",
            timezone: user.timezone || ""
        });
    } catch (err) {
        console.error("Me Error:", err);
        res.status(500).json({ message: "Failed to fetch user profile" });
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