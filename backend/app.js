const express = require('express');
const cors = require('cors');
require('express-async-errors');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-key-for-demo';

// Middleware for auth
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, team: user.team }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, team: user.team } });
});

app.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

app.get('/users', authenticate, (req, res) => {
    const users = db.prepare('SELECT id, username, role, team FROM users').all();
    res.json(users);
});

// Work Items List
app.get('/work-items', authenticate, (req, res) => {
    const { state, assignee_id, page = 1, limit = 50, search } = req.query;
    let query = 'SELECT * FROM work_items WHERE 1=1';
    const params = [];

    if (state) {
        query += ' AND state = ?';
        params.push(state);
    }
    if (assignee_id) {
        query += ' AND assignee_id = ?';
        params.push(assignee_id);
    }
    if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    
    // Count total
    const countQuery = query.replace('*', 'COUNT(*) as count');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const items = db.prepare(query).all(...params);
    res.json({
        data: items,
        meta: { total, page: Number(page), limit: Number(limit) }
    });
});

// Get Work Item
app.get('/work-items/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const item = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const comments = db.prepare('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE work_item_id = ? ORDER BY created_at ASC').all(id);
    const audit_logs = db.prepare('SELECT a.*, u.username FROM audit_logs a JOIN users u ON a.user_id = u.id WHERE work_item_id = ? ORDER BY created_at ASC').all(id);

    res.json({ ...item, comments, audit_logs });
});

// Create Work Item
app.post('/work-items', authenticate, (req, res) => {
    const { title, description, priority, assignee_id } = req.body;
    
    const stmt = db.prepare('INSERT INTO work_items (title, description, priority, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(title, description, priority || 'Medium', assignee_id || null, req.user.id);
    
    // Log audit
    db.prepare('INSERT INTO audit_logs (work_item_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(
        result.lastInsertRowid, req.user.id, 'CREATED', 'Item created'
    );

    res.status(201).json({ id: result.lastInsertRowid });
});

// Update Work Item (Handles concurrency via version)
app.put('/work-items/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const { title, description, state, priority, assignee_id, version } = req.body;

    if (version === undefined) {
        return res.status(400).json({ error: 'Version is required for optimistic concurrency control.' });
    }

    const currentItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id);
    if (!currentItem) return res.status(404).json({ error: 'Not found' });

    if (currentItem.version !== version) {
        return res.status(409).json({ error: 'Conflict: The work item has been modified by another user. Please refresh and try again.' });
    }

    // Role Enforcement: Viewers cannot update
    if (req.user.role === 'Viewer') {
        return res.status(403).json({ error: 'Forbidden: Viewers cannot update work items.' });
    }

    // Prepare update and audit trail
    const changes = [];
    if (currentItem.state !== state && state) changes.push(`State changed from ${currentItem.state} to ${state}`);
    if (currentItem.priority !== priority && priority) changes.push(`Priority changed from ${currentItem.priority} to ${priority}`);
    if (currentItem.assignee_id !== assignee_id) changes.push(`Assignee changed from ${currentItem.assignee_id} to ${assignee_id}`);

    const stmt = db.prepare(`
        UPDATE work_items 
        SET title = COALESCE(?, title), 
            description = COALESCE(?, description), 
            state = COALESCE(?, state), 
            priority = COALESCE(?, priority), 
            assignee_id = ?, 
            version = version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?
    `);

    const result = stmt.run(title, description, state, priority, assignee_id || null, id, version);
    
    if (result.changes === 0) {
        // Just in case it was updated right between the check and here
        return res.status(409).json({ error: 'Conflict: The work item was just modified by another user.' });
    }

    if (changes.length > 0) {
        db.prepare('INSERT INTO audit_logs (work_item_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(
            id, req.user.id, 'UPDATED', changes.join('. ')
        );
    }

    // Dummy async processing for notifications if assigned to someone
    if (assignee_id && currentItem.assignee_id !== assignee_id) {
        setTimeout(() => {
            console.log(`[Async] Sending notification to user ${assignee_id} about assignment of item ${id}`);
        }, 100);
    }

    res.json({ success: true });
});

// Add Comment
app.post('/work-items/:id/comments', authenticate, (req, res) => {
    const id = req.params.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    db.prepare('INSERT INTO comments (work_item_id, user_id, content) VALUES (?, ?, ?)').run(id, req.user.id, content);
    
    db.prepare('INSERT INTO audit_logs (work_item_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(
        id, req.user.id, 'COMMENT_ADDED', 'User added a comment'
    );

    res.status(201).json({ success: true });
});

module.exports = app;
