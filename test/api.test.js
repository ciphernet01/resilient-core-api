const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');

const testDbPath = path.join(__dirname, 'test-db.json');

process.env.DATA_FILE = testDbPath;
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const app = require('../src/app');

async function resetDb() {
  await fs.writeFile(testDbPath, JSON.stringify({ users: [], projects: [] }, null, 2));
}

test.beforeEach(async () => {
  await resetDb();
});

test.after(async () => {
  try {
    await fs.unlink(testDbPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
});

test('register, login, and manage own project', async () => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123',
      tenantId: 'tenant-acme'
    })
    .expect(201);

  assert.equal(registerResponse.body.success, true);
  assert.ok(registerResponse.body.data.token);

  const token = registerResponse.body.data.token;

  const createResponse = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Launch v2',
      description: 'Coordinate release work across teams.',
      status: 'planned'
    })
    .expect(201);

  assert.equal(createResponse.body.data.title, 'Launch v2');
  const projectId = createResponse.body.data.id;

  const listResponse = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(listResponse.body.data.length, 1);
  assert.equal(listResponse.body.data[0].id, projectId);

  const updateResponse = await request(app)
    .patch(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'completed' })
    .expect(200);

  assert.equal(updateResponse.body.data.status, 'completed');

  await request(app)
    .delete(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204);
});

test('prevents one user from modifying another user project', async () => {
  const ownerRegister = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'Password123',
      tenantId: 'tenant-acme'
    })
    .expect(201);

  const attackerRegister = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Attacker',
      email: 'attacker@example.com',
      password: 'Password123',
      tenantId: 'tenant-acme'
    })
    .expect(201);

  const project = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${ownerRegister.body.data.token}`)
    .send({
      title: 'Protected project',
      description: 'Only the owner can change me.',
      status: 'planned'
    })
    .expect(201);

  await request(app)
    .patch(`/api/projects/${project.body.data.id}`)
    .set('Authorization', `Bearer ${attackerRegister.body.data.token}`)
    .send({ status: 'archived' })
    .expect(403);
});
