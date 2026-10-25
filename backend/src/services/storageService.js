import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const BACKUP_FILE = path.join(DATA_DIR, 'splitmate_store.json');

class StorageService {
  constructor() {
    this.redisClient = null;
    this.isRedisAvailable = false;
    this.memoryStore = {
      users: [],
      groups: [],
      expenses: [],
      settlements: [],
      activities: [],
      metadata: { seeded: false, lastUpdated: new Date().toISOString() }
    };
    this.ready = this.init();
  }

  async ensureReady() {
    if (this.ready) await this.ready;
  }

  async init() {
    // 1. Ensure local data directory exists for persistent fallback
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.warn('Could not create data dir:', err.message);
      }
    }

    // 2. Load existing persistent backup if available
    this.loadFromFile();

    // 3. Attempt Redis connection if REDIS_URL is provided or default redis port
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 500, 2000);
        },
        lazyConnect: true
      });

      this.redisClient.on('connect', () => {
        this.isRedisAvailable = true;
        console.log(`[StorageService] Connected to Redis at ${redisUrl}`);
      });

      this.redisClient.on('error', (err) => {
        this.isRedisAvailable = false;
        // Silent degrade to file-backed persistence without crashing
      });

      await this.redisClient.connect();
      // If connected, sync with Redis
      await this.syncFromRedis();
    } catch (err) {
      this.isRedisAvailable = false;
      console.log('[StorageService] Redis not available, using file-backed persistent storage at:', BACKUP_FILE);
    }
  }

  loadFromFile() {
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryStore = { ...this.memoryStore, ...parsed };
        console.log('[StorageService] Loaded existing state from disk.');
      } catch (err) {
        console.error('[StorageService] Error loading backup file:', err.message);
      }
    }
  }

  saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StorageService] Error persisting to disk:', err.message);
    }
  }

  async syncFromRedis() {
    if (!this.isRedisAvailable || !this.redisClient) return;
    try {
      const [u, g, e, s, a, m] = await Promise.all([
        this.redisClient.get('splitmate:users'),
        this.redisClient.get('splitmate:groups'),
        this.redisClient.get('splitmate:expenses'),
        this.redisClient.get('splitmate:settlements'),
        this.redisClient.get('splitmate:activities'),
        this.redisClient.get('splitmate:metadata')
      ]);

      if (u) {
        this.memoryStore.users = JSON.parse(u);
        if (g) this.memoryStore.groups = JSON.parse(g);
        if (e) this.memoryStore.expenses = JSON.parse(e);
        if (s) this.memoryStore.settlements = JSON.parse(s);
        if (a) this.memoryStore.activities = JSON.parse(a);
        if (m) this.memoryStore.metadata = JSON.parse(m);
        this.saveToFile();
      } else if (this.memoryStore.users.length > 0) {
        await Promise.all([
          this.redisClient.set('splitmate:users', JSON.stringify(this.memoryStore.users)),
          this.redisClient.set('splitmate:groups', JSON.stringify(this.memoryStore.groups)),
          this.redisClient.set('splitmate:expenses', JSON.stringify(this.memoryStore.expenses)),
          this.redisClient.set('splitmate:settlements', JSON.stringify(this.memoryStore.settlements)),
          this.redisClient.set('splitmate:activities', JSON.stringify(this.memoryStore.activities)),
          this.redisClient.set('splitmate:metadata', JSON.stringify(this.memoryStore.metadata))
        ]);
      }
    } catch (err) {
      console.warn('[StorageService] Error syncing from Redis:', err.message);
    }
  }

  async persistCollection(key, data) {
    await this.ensureReady();
    this.memoryStore[key] = data;
    this.memoryStore.metadata.lastUpdated = new Date().toISOString();
    this.saveToFile();

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set(`splitmate:${key}`, JSON.stringify(data));
        await this.redisClient.set(
          'splitmate:metadata',
          JSON.stringify(this.memoryStore.metadata)
        );
      } catch (err) {
        console.warn(`[StorageService] Redis write failed for ${key}:`, err.message);
      }
    }
  }

  // --- Users ---
  async getUsers() {
    await this.ensureReady();
    return [...this.memoryStore.users];
  }

  async getUser(id) {
    await this.ensureReady();
    return this.memoryStore.users.find(u => u.id === id) || null;
  }

  async saveUser(user) {
    await this.ensureReady();
    const index = this.memoryStore.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.memoryStore.users[index] = { ...this.memoryStore.users[index], ...user };
    } else {
      this.memoryStore.users.push(user);
    }
    await this.persistCollection('users', this.memoryStore.users);
    return user;
  }

  // --- Groups ---
  async getGroups() {
    await this.ensureReady();
    return [...this.memoryStore.groups];
  }

  async getGroup(id) {
    await this.ensureReady();
    return this.memoryStore.groups.find(g => g.id === id) || null;
  }

  async saveGroup(group) {
    await this.ensureReady();
    const index = this.memoryStore.groups.findIndex(g => g.id === group.id);
    if (index >= 0) {
      this.memoryStore.groups[index] = { ...this.memoryStore.groups[index], ...group };
    } else {
      this.memoryStore.groups.push(group);
    }
    await this.persistCollection('groups', this.memoryStore.groups);
    return group;
  }

  async deleteGroup(id) {
    await this.ensureReady();
    this.memoryStore.groups = this.memoryStore.groups.filter(g => g.id !== id);
    // Also remove associated expenses
    this.memoryStore.expenses = this.memoryStore.expenses.filter(e => e.groupId !== id);
    await this.persistCollection('groups', this.memoryStore.groups);
    await this.persistCollection('expenses', this.memoryStore.expenses);
    return true;
  }

  // --- Expenses ---
  async getExpenses(filters = {}) {
    await this.ensureReady();
    let list = [...this.memoryStore.expenses];
    if (filters.groupId) {
      list = list.filter(e => e.groupId === filters.groupId);
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        e =>
          e.description.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.payerName.toLowerCase().includes(q) ||
          e.groupName.toLowerCase().includes(q)
      );
    }
    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }

  async getExpense(id) {
    await this.ensureReady();
    return this.memoryStore.expenses.find(e => e.id === id) || null;
  }

  async saveExpense(expense) {
    await this.ensureReady();
    const index = this.memoryStore.expenses.findIndex(e => e.id === expense.id);
    if (index >= 0) {
      this.memoryStore.expenses[index] = { ...this.memoryStore.expenses[index], ...expense };
    } else {
      this.memoryStore.expenses.unshift(expense);
    }
    await this.persistCollection('expenses', this.memoryStore.expenses);
    return expense;
  }

  async deleteExpense(id) {
    await this.ensureReady();
    const existing = this.memoryStore.expenses.find(e => e.id === id);
    if (!existing) return false;
    this.memoryStore.expenses = this.memoryStore.expenses.filter(e => e.id !== id);
    await this.persistCollection('expenses', this.memoryStore.expenses);
    return true;
  }

  // --- Settlements ---
  async getSettlements() {
    await this.ensureReady();
    return [...this.memoryStore.settlements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getSettlement(id) {
    await this.ensureReady();
    return this.memoryStore.settlements.find(s => s.id === id) || null;
  }

  async saveSettlement(settlement) {
    await this.ensureReady();
    this.memoryStore.settlements.unshift(settlement);
    await this.persistCollection('settlements', this.memoryStore.settlements);
    return settlement;
  }

  // --- Activities ---
  async getActivities(limit = 20) {
    return [...this.memoryStore.activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async addActivity(activity) {
    const record = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...activity
    };
    this.memoryStore.activities.unshift(record);
    if (this.memoryStore.activities.length > 100) {
      this.memoryStore.activities = this.memoryStore.activities.slice(0, 100);
    }
    await this.persistCollection('activities', this.memoryStore.activities);
    return record;
  }

  // --- Reset & Seed ---
  async resetData() {
    this.memoryStore = {
      users: [],
      groups: [],
      expenses: [],
      settlements: [],
      activities: [],
      metadata: { seeded: false, lastUpdated: new Date().toISOString() }
    };
    this.saveToFile();
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (err) {
        console.warn('Redis flush error:', err.message);
      }
    }
    return true;
  }

  async seedData(seedPayload) {
    this.memoryStore.users = seedPayload.users || [];
    this.memoryStore.groups = seedPayload.groups || [];
    this.memoryStore.expenses = seedPayload.expenses || [];
    this.memoryStore.settlements = seedPayload.settlements || [];
    this.memoryStore.activities = seedPayload.activities || [];
    this.memoryStore.metadata = {
      seeded: true,
      lastUpdated: new Date().toISOString(),
      seedTimestamp: new Date().toISOString()
    };

    this.saveToFile();

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set('splitmate:users', JSON.stringify(this.memoryStore.users));
        await this.redisClient.set('splitmate:groups', JSON.stringify(this.memoryStore.groups));
        await this.redisClient.set('splitmate:expenses', JSON.stringify(this.memoryStore.expenses));
        await this.redisClient.set('splitmate:settlements', JSON.stringify(this.memoryStore.settlements));
        await this.redisClient.set('splitmate:activities', JSON.stringify(this.memoryStore.activities));
        await this.redisClient.set('splitmate:metadata', JSON.stringify(this.memoryStore.metadata));
      } catch (err) {
        console.warn('Redis seed write error:', err.message);
      }
    }
    return true;
  }

  async close() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (err) {
        // ignore
      }
    }
  }

  getStatus() {
    return {
      storageEngine: this.isRedisAvailable ? 'Redis (Cluster/Standalone)' : 'File-backed Persistent Store',
      isRedisConnected: this.isRedisAvailable,
      backupFile: BACKUP_FILE,
      counts: {
        users: this.memoryStore.users.length,
        groups: this.memoryStore.groups.length,
        expenses: this.memoryStore.expenses.length,
        settlements: this.memoryStore.settlements.length,
        activities: this.memoryStore.activities.length
      },
      metadata: this.memoryStore.metadata
    };
  }
}

export const storage = new StorageService();
