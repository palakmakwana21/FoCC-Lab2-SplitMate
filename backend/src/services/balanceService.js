/**
 * Balance & Financial Calculation Service for SplitMate
 * All arithmetic is performed using integer minor units (paise: 1 INR = 100 paise)
 * to prevent floating-point rounding errors.
 */

export function toPaise(amount) {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[₹,\s]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  return 0;
}

export function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

export function formatINR(paise, includeSymbol = true) {
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const prefix = paise < 0 ? '-' : '';
  return includeSymbol ? `${prefix}₹${rupees}` : `${prefix}${rupees}`;
}

/**
 * 1. EQUAL SPLIT
 * Divides total into participant shares. Deterministically distributes 1-paisa
 * remainder to the first participants so sum(shares) === totalPaise exactly.
 */
export function calculateEqualSplit(totalPaise, participantIds) {
  if (!participantIds || participantIds.length === 0) {
    throw new Error('At least one participant is required for equal split');
  }
  if (totalPaise <= 0) {
    throw new Error('Expense amount must be positive');
  }

  const count = participantIds.length;
  const baseShare = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  return participantIds.map((userId, index) => ({
    userId,
    sharePaise: baseShare + (index < remainder ? 1 : 0),
    percentage: Number(((1 / count) * 100).toFixed(2))
  }));
}

/**
 * 2. EXACT / CUSTOM SPLIT
 * Validates that custom participant shares sum strictly to totalPaise.
 */
export function validateAndCalculateExactSplit(totalPaise, shares) {
  if (!shares || shares.length === 0) {
    throw new Error('Participant shares must be provided');
  }

  let calculatedSum = 0;
  const normalizedShares = shares.map(item => {
    const sharePaise = item.sharePaise !== undefined ? item.sharePaise : toPaise(item.amount);
    if (sharePaise < 0) {
      throw new Error(`Share for user ${item.userId} cannot be negative`);
    }
    calculatedSum += sharePaise;
    return {
      userId: item.userId,
      sharePaise
    };
  });

  if (calculatedSum !== totalPaise) {
    const diff = fromPaise(totalPaise - calculatedSum);
    throw new Error(
      `Sum of shares (₹${fromPaise(calculatedSum)}) does not match total expense (₹${fromPaise(totalPaise)}). Difference: ₹${diff}`
    );
  }

  return normalizedShares.map(item => ({
    ...item,
    percentage: Number(((item.sharePaise / totalPaise) * 100).toFixed(2))
  }));
}

/**
 * 3. PERCENTAGE SPLIT
 * Validates that percentages sum to 100%, then allocates integer minor units (paise)
 * using deterministic largest-remainder rounding.
 */
export function calculatePercentageSplit(totalPaise, percentageShares) {
  if (!percentageShares || percentageShares.length === 0) {
    throw new Error('Participant percentages must be provided');
  }

  const totalPercentage = percentageShares.reduce((acc, curr) => acc + Number(curr.percentage), 0);
  if (Math.abs(totalPercentage - 100) > 0.05) {
    throw new Error(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}%)`);
  }

  // Calculate base shares and fractional remainder
  const computed = percentageShares.map((item, index) => {
    const rawShare = (totalPaise * Number(item.percentage)) / 100;
    const baseShare = Math.floor(rawShare);
    const fraction = rawShare - baseShare;
    return {
      userId: item.userId,
      percentage: Number(item.percentage),
      baseShare,
      fraction,
      originalIndex: index
    };
  });

  const sumBase = computed.reduce((acc, curr) => acc + curr.baseShare, 0);
  let remainder = totalPaise - sumBase;

  // Sort by highest fractional remainder to allocate residual paise
  const sorted = [...computed].sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < remainder; i++) {
    sorted[i % sorted.length].baseShare += 1;
  }

  return computed.map(item => ({
    userId: item.userId,
    sharePaise: item.baseShare,
    percentage: item.percentage
  }));
}

/**
 * 4. COMPREHENSIVE BALANCE CALCULATION
 * Net balance = Total paid on shared expenses - Total assigned shares + Settlements received - Settlements paid.
 * Positive (+) = User is owed money (receives).
 * Negative (-) = User owes money (pays).
 * For any closed group, sum of net balances === 0.
 */
export function calculateBalances(users, expenses, settlements, groupId = null) {
  const userBalances = {};

  // Initialize for all users
  for (const user of users) {
    userBalances[user.id] = {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      totalPaidPaise: 0,
      totalSharePaise: 0,
      settlementsReceivedPaise: 0,
      settlementsPaidPaise: 0,
      netBalancePaise: 0
    };
  }

  // Filter expenses by group if requested
  const relevantExpenses = groupId
    ? expenses.filter(e => e.groupId === groupId)
    : expenses;

  // Process expenses
  for (const exp of relevantExpenses) {
    const payerId = exp.payerId;
    const totalPaise = exp.amountPaise;

    if (userBalances[payerId]) {
      userBalances[payerId].totalPaidPaise += totalPaise;
    }

    if (Array.isArray(exp.shares)) {
      for (const share of exp.shares) {
        if (userBalances[share.userId]) {
          userBalances[share.userId].totalSharePaise += share.sharePaise;
        }
      }
    }
  }

  // Filter settlements by group if requested
  const relevantSettlements = groupId
    ? settlements.filter(s => s.groupId === groupId)
    : settlements;

  // Process settlements
  for (const st of relevantSettlements) {
    const payerId = st.payerId;
    const recipientId = st.recipientId;
    const amountPaise = st.amountPaise;

    if (userBalances[payerId]) {
      userBalances[payerId].settlementsPaidPaise += amountPaise;
    }
    if (userBalances[recipientId]) {
      userBalances[recipientId].settlementsReceivedPaise += amountPaise;
    }
  }

  // Compute final net balance for each user
  for (const userId of Object.keys(userBalances)) {
    const u = userBalances[userId];
    u.netBalancePaise =
      u.totalPaidPaise -
      u.totalSharePaise +
      u.settlementsPaidPaise -
      u.settlementsReceivedPaise;

    u.netBalance = fromPaise(u.netBalancePaise);
    u.totalPaid = fromPaise(u.totalPaidPaise);
    u.totalShare = fromPaise(u.totalSharePaise);
    u.settlementsReceived = fromPaise(u.settlementsReceivedPaise);
    u.settlementsPaid = fromPaise(u.settlementsPaidPaise);
  }

  return userBalances;
}

/**
 * 5. SMART DEBT SIMPLIFICATION ALGORITHM (Graph Theory / Min Cash Flow)
 * Takes a dictionary of user net balances (where sum of balances == 0)
 * and generates the minimal number of direct settlements required to settle everyone.
 */
export function simplifyDebts(userBalances, userMap = {}) {
  // Separate into debtors and creditors
  const debtors = [];
  const creditors = [];

  for (const [userId, record] of Object.entries(userBalances)) {
    const net = record.netBalancePaise;
    if (net < 0) {
      debtors.push({ userId, amount: -net }); // owes this amount
    } else if (net > 0) {
      creditors.push({ userId, amount: net }); // should receive this amount
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        fromUserName: userMap[debtor.userId]?.name || debtor.userId,
        toUserId: creditor.userId,
        toUserName: userMap[creditor.userId]?.name || creditor.userId,
        amountPaise: transferAmount,
        amount: fromPaise(transferAmount)
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount === 0) dIdx++;
    if (creditor.amount === 0) cIdx++;
  }

  return transfers;
}

/**
 * 6. BILATERAL RELATIONSHIPS (Relative to a Current User, e.g. Alex)
 * Computes direct bilateral balance between currentUserId and each other friend.
 */
export function calculateBilateralBalances(users, expenses, settlements, currentUserId) {
  const friendLedger = {};

  for (const user of users) {
    if (user.id === currentUserId) continue;
    friendLedger[user.id] = {
      friendId: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      netPaise: 0, // > 0: friend owes currentUser; < 0: currentUser owes friend
      groups: new Set()
    };
  }

  // Iterate over all expenses
  for (const exp of expenses) {
    const payerId = exp.payerId;
    const isCurrentUserPayer = payerId === currentUserId;

    if (Array.isArray(exp.shares)) {
      for (const share of exp.shares) {
        const participantId = share.userId;

        // Case 1: Current user paid for a friend
        if (isCurrentUserPayer && participantId !== currentUserId && friendLedger[participantId]) {
          friendLedger[participantId].netPaise += share.sharePaise;
          if (exp.groupName) friendLedger[participantId].groups.add(exp.groupName);
        }

        // Case 2: Friend paid for current user
        if (!isCurrentUserPayer && participantId === currentUserId && friendLedger[payerId]) {
          friendLedger[payerId].netPaise -= share.sharePaise;
          if (exp.groupName) friendLedger[payerId].groups.add(exp.groupName);
        }
      }
    }
  }

  // Apply settlements between current user and friend
  for (const st of settlements) {
    if (st.payerId === currentUserId && friendLedger[st.recipientId]) {
      // Current user paid friend => increases current user's balance relative to friend (+ netPaise)
      friendLedger[st.recipientId].netPaise += st.amountPaise;
    } else if (st.recipientId === currentUserId && friendLedger[st.payerId]) {
      // Friend paid current user => friend paid off debt (- netPaise)
      friendLedger[st.payerId].netPaise -= st.amountPaise;
    }
  }

  return Object.values(friendLedger).map(f => {
    const net = f.netPaise;
    let status = 'settled';
    if (net > 0) status = 'owes_you';
    else if (net < 0) status = 'you_owe';

    return {
      friendId: f.friendId,
      name: f.name,
      avatar: f.avatar,
      email: f.email,
      netPaise: net,
      netAmount: fromPaise(Math.abs(net)),
      status, // 'owes_you', 'you_owe', 'settled'
      groups: Array.from(f.groups)
    };
  });
}
