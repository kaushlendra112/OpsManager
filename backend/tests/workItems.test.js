const request = require('supertest');
const app = require('../app');
const { db, initDb } = require('../db');
let token;

beforeAll(() => {
    // Reset database for tests
    db.exec(`
        DROP TABLE IF EXISTS audit_logs;
        DROP TABLE IF EXISTS comments;
        DROP TABLE IF EXISTS work_items;
        DROP TABLE IF EXISTS users;
    `);
    initDb();

    // Generate token for testing
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ id: 1, username: 'admin', role: 'Admin', team: 'Leadership' }, 'super-secret-key-for-demo', { expiresIn: '1h' });
});

describe('Work Items API', () => {
    let workItemId;

    it('should block unauthenticated access', async () => {
        const res = await request(app).get('/work-items');
        expect(res.statusCode).toEqual(401);
    });

    it('should create a new work item', async () => {
        const res = await request(app)
            .post('/work-items')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Issue',
                description: 'This is a test'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        workItemId = res.body.id;
    });

    it('should update a work item successfully with correct version', async () => {
        const res = await request(app)
            .put(`/work-items/${workItemId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Updated Issue',
                state: 'In Progress',
                version: 1
            });
        expect(res.statusCode).toEqual(200);
    });

    it('should fail to update a work item with incorrect version (Concurrency test)', async () => {
        const res = await request(app)
            .put(`/work-items/${workItemId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Conflicting Update',
                state: 'Closed',
                version: 1 // Already updated to version 2 in previous test
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toMatch(/Conflict/);
    });

    it('should prevent viewers from updating (Authorization test)', async () => {
        const jwt = require('jsonwebtoken');
        const viewerToken = jwt.sign({ id: 4, username: 'viewer1', role: 'Viewer', team: 'External' }, 'super-secret-key-for-demo', { expiresIn: '1h' });
        
        const res = await request(app)
            .put(`/work-items/${workItemId}`)
            .set('Authorization', `Bearer ${viewerToken}`)
            .send({
                title: 'Malicious Update',
                version: 2
            });
        expect(res.statusCode).toEqual(403);
    });
});
