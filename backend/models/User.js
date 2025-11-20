// User Model (SQLite with sqlite3)
const { getDB } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Find user by ID
     */
    static async findById(id) {
        const db = getDB();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (user) {
            user.isActive = Boolean(user.isActive);
        }
        return user;
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const db = getDB();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (user) {
            user.isActive = Boolean(user.isActive);
        }
        return user;
    }

    /**
     * Find user by username with password (for login)
     */
    static async findByUsernameWithPassword(username) {
        const db = getDB();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (user) {
            user.isActive = Boolean(user.isActive);
        }
        return user;
    }

    /**
     * Create new user
     */
    static async create(userData) {
        const db = getDB();
        const { username, password, role, fullName, email, phone, isActive = true } = userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.run(
            `INSERT INTO users (username, password, role, fullName, email, phone, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, role, fullName, email || null, phone || null, isActive ? 1 : 0]
        );

        // Return result object with lastID
        return result;
    }

    /**
     * Compare password
     */
    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }

    /**
     * Update user
     */
    static async update(id, userData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (userData.fullName !== undefined) {
            fields.push('fullName = ?');
            values.push(userData.fullName);
        }
        if (userData.email !== undefined) {
            fields.push('email = ?');
            values.push(userData.email);
        }
        if (userData.phone !== undefined) {
            fields.push('phone = ?');
            values.push(userData.phone);
        }
        if (userData.role !== undefined) {
            fields.push('role = ?');
            values.push(userData.role);
        }
        if (userData.isActive !== undefined) {
            fields.push('isActive = ?');
            values.push(userData.isActive ? 1 : 0);
        }
        if (userData.password !== undefined) {
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            fields.push('password = ?');
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }
}

module.exports = User;
