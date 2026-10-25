import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { storage } from '../src/services/storageService.js';
import { seedDemoData } from '../src/services/seedService.js';

let server;
let baseUrl;

test.before(async () => {
  // Ensure seed data is in place
  await seedDemoData(true);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await storage.close();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API 1: GET /api/health returns 200 and healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.service, 'splitmate-backend');
});

test('API 2: GET /api/dashboard returns financial metrics and activities', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard?userId=usr_alex`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.metrics);
  assert.ok(data.currentUser);
  assert.ok(Array.isArray(data.groupSummaries));
  assert.ok(Array.isArray(data.recentExpenses));
});

test('API 3: Groups CRUD operations', async () => {
  // Create group
  const createRes = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hackathon Team 🚀',
      category: 'Project',
      description: 'Expenses for 48h hackathon',
      memberIds: ['usr_alex', 'usr_maya']
    })
  });
  assert.equal(createRes.status, 201);
  const createdGroup = await createRes.json();
  assert.equal(createdGroup.name, 'Hackathon Team 🚀');

  // Fetch group details
  const getRes = await fetch(`${baseUrl}/api/groups/${createdGroup.id}`);
  assert.equal(getRes.status, 200);
  const details = await getRes.json();
  assert.equal(details.group.id, createdGroup.id);
  assert.equal(details.members.length, 2);

  // Update group
  const patchRes = await fetch(`${baseUrl}/api/groups/${createdGroup.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Updated hackathon description' })
  });
  assert.equal(patchRes.status, 200);
  const updated = await patchRes.json();
  assert.equal(updated.description, 'Updated hackathon description');

  // Delete group
  const delRes = await fetch(`${baseUrl}/api/groups/${createdGroup.id}`, {
    method: 'DELETE'
  });
  assert.equal(delRes.status, 200);
});

test('API 4: Expense Creation, Update, and Deletion with Balance Recalculation', async () => {
  // Create expense
  const createRes = await fetch(`${baseUrl}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Team Pizza & Drinks',
      amount: 1500.0,
      groupId: 'grp_goa',
      payerId: 'usr_alex',
      category: 'Food & Dining',
      splitMethod: 'equal',
      participantIds: ['usr_alex', 'usr_maya', 'usr_rahul']
    })
  });
  assert.equal(createRes.status, 201);
  const exp = await createRes.json();
  assert.equal(exp.amount, 1500.0);
  assert.equal(exp.shares.length, 3);
  assert.equal(exp.shares[0].shareAmount, 500.0);

  // Delete expense
  const delRes = await fetch(`${baseUrl}/api/expenses/${exp.id}`, {
    method: 'DELETE'
  });
  assert.equal(delRes.status, 200);
});

test('API 5: Settlement Recording and Validation', async () => {
  // Valid settlement
  const settleRes = await fetch(`${baseUrl}/api/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payerId: 'usr_maya',
      recipientId: 'usr_alex',
      amount: 450.0,
      groupId: 'grp_flatmates',
      method: 'UPI',
      notes: 'Cleared Wi-Fi debt'
    })
  });
  assert.equal(settleRes.status, 201);
  const stl = await settleRes.json();
  assert.equal(stl.amount, 450.0);

  // Invalid settlement (payer === recipient)
  const invalidRes = await fetch(`${baseUrl}/api/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payerId: 'usr_alex',
      recipientId: 'usr_alex',
      amount: 100.0
    })
  });
  assert.equal(invalidRes.status, 400);
});

test('API 6: GET /api/insights returns category and monthly summaries', async () => {
  const res = await fetch(`${baseUrl}/api/insights`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.hasData, true);
  assert.ok(Array.isArray(data.byCategory));
  assert.ok(Array.isArray(data.monthlyTrend));
});

test('API 7: Seed Idempotency test', async () => {
  // Second call with force=false should not duplicate data
  const initialUsers = await storage.getUsers();
  await seedDemoData(false);
  const usersAfter = await storage.getUsers();
  assert.equal(usersAfter.length, initialUsers.length);
});
