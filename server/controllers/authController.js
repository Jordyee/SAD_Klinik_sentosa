const { readData, writeData, generateId } = require('../utils/jsonHelper');

const USERS_FILE = 'users.json';

const login = (req, res) => {
    const { username, password, role } = req.body;
    const users = readData(USERS_FILE);

    const user = users.find(u => u.username === username && u.password === password && u.role === role);

    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
};

const register = (req, res) => {
    const { username, password, role, fullName, email } = req.body;
    const users = readData(USERS_FILE);

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const newUser = {
        id: generateId(),
        username,
        password, // In a real app, hash this!
        role,
        fullName,
        email
    };

    users.push(newUser);
    if (writeData(USERS_FILE, users)) {
        res.json({ success: true, message: 'User registered successfully', user: newUser });
    } else {
        res.status(500).json({ success: false, message: 'Failed to register user' });
    }
};

const getUsers = (req, res) => {
    const users = readData(USERS_FILE);
    // Return users without passwords
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
};

const deleteUser = (req, res) => {
    const { id } = req.params;
    let users = readData(USERS_FILE);
    const initialLength = users.length;

    users = users.filter(user => user.id !== id);

    if (users.length < initialLength) {
        writeData(USERS_FILE, users);
        res.json({ success: true, message: 'User deleted successfully' });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
};

module.exports = {
    login,
    register,
    getUsers,
    deleteUser
};
