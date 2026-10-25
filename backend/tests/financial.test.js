import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPaise,
  fromPaise,
  formatINR,
  calculateEqualSplit,
  validateAndCalculateExactSplit,
  calculatePercentageSplit,
  calculateBalances,
  simplifyDebts
} from '../src/services/balanceService.js';

test('1. toPaise and fromPaise conversions work accurately', () => {
  assert.equal(toPaise(100), 10000);
  assert.equal(toPaise(4200.5), 420050);
  assert.equal(toPaise('₹4,200.00'), 420000);
  assert.equal(fromPaise(420050), 4200.5);
  assert.equal(fromPaise(100), 1.0);
  assert.equal(formatINR(420000), '₹4,200.00');
});

test('2. Equal split divides amount and allocates remainder paise deterministically', () => {
  // ₹100 split among 3 people: 10000 paise / 3 = 3333 paise each + 1 remainder
  const shares = calculateEqualSplit(10000, ['u1', 'u2', 'u3']);
  assert.equal(shares.length, 3);
  assert.equal(shares[0].sharePaise, 3334);
  assert.equal(shares[1].sharePaise, 3333);
  assert.equal(shares[2].sharePaise, 3333);

  // Sum must strictly equal total amount
  const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
  assert.equal(sum, 10000);
});

test('3. Custom split validation rejects mismatched sums and accepts exact sums', () => {
  const total = 500000; // ₹5,000.00

  // Valid custom shares
  const valid = validateAndCalculateExactSplit(total, [
    { userId: 'u1', sharePaise: 300000 },
    { userId: 'u2', sharePaise: 200000 }
  ]);
  assert.equal(valid.length, 2);
  assert.equal(valid[0].sharePaise + valid[1].sharePaise, total);

  // Invalid custom shares: sum mismatch
  assert.throws(() => {
    validateAndCalculateExactSplit(total, [
      { userId: 'u1', sharePaise: 200000 },
      { userId: 'u2', sharePaise: 200000 } // only 400000
    ]);
  }, /does not match/);
});

test('4. Percentage split requires 100% and allocates integer paise with no loss', () => {
  const total = 10000; // ₹100.00 (33.33%, 33.33%, 33.34%)
  const shares = calculatePercentageSplit(total, [
    { userId: 'u1', percentage: 33.33 },
    { userId: 'u2', percentage: 33.33 },
    { userId: 'u3', percentage: 33.34 }
  ]);

  const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
  assert.equal(sum, total);

  // Rejects invalid percentage sum
  assert.throws(() => {
    calculatePercentageSplit(total, [
      { userId: 'u1', percentage: 50 },
      { userId: 'u2', percentage: 40 } // 90%
    ]);
  }, /must equal 100%/);
});

test('5. Balance calculation ensures zero-sum net balances in closed groups', () => {
  const users = [
    { id: 'u1', name: 'User 1' },
    { id: 'u2', name: 'User 2' },
    { id: 'u3', name: 'User 3' }
  ];

  // Expense: u1 paid ₹3,000 for u1, u2, u3 (₹1,000 each)
  const expenses = [
    {
      id: 'e1',
      groupId: 'g1',
      payerId: 'u1',
      amountPaise: 300000,
      shares: [
        { userId: 'u1', sharePaise: 100000 },
        { userId: 'u2', sharePaise: 100000 },
        { userId: 'u3', sharePaise: 100000 }
      ]
    }
  ];

  // Settlement: u2 paid u1 ₹500
  const settlements = [
    {
      id: 's1',
      groupId: 'g1',
      payerId: 'u2',
      recipientId: 'u1',
      amountPaise: 50000
    }
  ];

  const balances = calculateBalances(users, expenses, settlements, 'g1');

  // u1: paid 3000, share 1000, received 500 => net = +1500
  assert.equal(balances['u1'].netBalancePaise, 150000);
  // u2: paid 0, share 1000, paid settlement 500 => net = -500
  assert.equal(balances['u2'].netBalancePaise, -50000);
  // u3: paid 0, share 1000 => net = -1000
  assert.equal(balances['u3'].netBalancePaise, -100000);

  // Group invariant: sum of net balances MUST BE 0!
  const sumBalances = Object.values(balances).reduce((sum, b) => sum + b.netBalancePaise, 0);
  assert.equal(sumBalances, 0);
});

test('6. Debt simplification algorithm minimizes transfer count while preserving net balance', () => {
  const balances = {
    u1: { netBalancePaise: 300000 }, // +₹3,000
    u2: { netBalancePaise: -200000 }, // -₹2,000
    u3: { netBalancePaise: -100000 }  // -₹1,000
  };

  const transfers = simplifyDebts(balances);
  assert.equal(transfers.length, 2);

  // Total transferred out from debtors
  const totalTransferred = transfers.reduce((acc, t) => acc + t.amountPaise, 0);
  assert.equal(totalTransferred, 300000);
});
