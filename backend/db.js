const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Viewer',
            team TEXT
        );

        CREATE TABLE IF NOT EXISTS work_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            state TEXT NOT NULL DEFAULT 'Open',
            priority TEXT NOT NULL DEFAULT 'Medium',
            assignee_id INTEGER,
            creator_id INTEGER NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignee_id) REFERENCES users(id),
            FOREIGN KEY (creator_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_item_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_item_id) REFERENCES work_items(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_item_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_item_id) REFERENCES work_items(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // Insert dummy users if empty
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (count.count === 0) {
        const insertUser = db.prepare('INSERT INTO users (username, password, role, team) VALUES (?, ?, ?, ?)');
        insertUser.run('admin', 'admin123', 'Admin', 'Leadership');
        insertUser.run('agent1', 'agent123', 'Agent', 'Support');
        insertUser.run('agent2', 'agent123', 'Agent', 'Engineering');
        insertUser.run('viewer1', 'viewer123', 'Viewer', 'External');
    }
}

module.exports = { db, initDb };
