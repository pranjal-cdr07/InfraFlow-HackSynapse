const crypto = require("crypto");

function generateTxHash() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

// =========================================================
// SECURITY DEPOSIT REFUND
// =========================================================

async function refundSecurityDeposit({ pool, bid, ownerId }) {
  console.log("BLOCKCHAIN REFUND STARTED FOR BID:", bid.id);

  const txHash = generateTxHash();

  // Create simulated blockchain transaction
  const transaction = await pool.query(
    `INSERT INTO transactions
    (
      type,
      from_user,
      to_user,
      amount,
      status,
      tx_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      "SECURITY_DEPOSIT_REFUND",
      ownerId,
      bid.contractor_id,
      bid.security_deposit,
      "CONFIRMED",
      txHash,
    ],
  );

  console.log("TRANSACTION CREATED:", transaction.rows[0]);

  // Link transaction to bid
  await pool.query(
    `UPDATE bids
     SET transaction_id = $1
     WHERE id = $2`,
    [transaction.rows[0].id, bid.id],
  );

  // Notify contractor
  await pool.query(
    `INSERT INTO notifications
    (
      user_id,
      message,
      type
    )
    VALUES ($1, $2, $3)`,
    [
      bid.contractor_id,
      `Your security deposit of ₹${Number(bid.security_deposit).toLocaleString(
        "en-IN",
      )} has been refunded. Transaction: ${txHash}`,
      "SECURITY_REFUND",
    ],
  );

  // Notify owner
  await pool.query(
    `INSERT INTO notifications
    (
      user_id,
      message,
      type
    )
    VALUES ($1, $2, $3)`,
    [
      ownerId,
      `Security deposit refunded to contractor. Transaction: ${txHash}`,
      "SECURITY_REFUND",
    ],
  );

  return transaction.rows[0];
}

// =========================================================
// MILESTONE PAYMENT
// =========================================================

async function releaseMilestonePayment({ pool, milestone }) {
  console.log("BLOCKCHAIN MILESTONE PAYMENT STARTED:", milestone.id);

  const txHash = generateTxHash();

  // Create simulated blockchain transaction
  const transaction = await pool.query(
    `INSERT INTO transactions
    (
      type,
      from_user,
      to_user,
      amount,
      status,
      tx_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      "MILESTONE_PAYMENT",
      milestone.contractor_id,
      milestone.subcontractor_id,
      milestone.amount,
      "CONFIRMED",
      txHash,
    ],
  );

  console.log("MILESTONE PAYMENT TRANSACTION:", transaction.rows[0]);

  // Notify subcontractor
  await pool.query(
    `INSERT INTO notifications
    (
      user_id,
      message,
      type
    )
    VALUES ($1, $2, $3)`,
    [
      milestone.subcontractor_id,
      `Milestone payment of ₹${Number(milestone.amount).toLocaleString(
        "en-IN",
      )} has been released. Transaction: ${txHash}`,
      "MILESTONE_PAYMENT",
    ],
  );

  // Notify general contractor
  await pool.query(
    `INSERT INTO notifications
    (
      user_id,
      message,
      type
    )
    VALUES ($1, $2, $3)`,
    [
      milestone.contractor_id,
      `Milestone payment released. Transaction: ${txHash}`,
      "MILESTONE_PAYMENT",
    ],
  );

  // Notify owner
  if (milestone.owner_id) {
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        milestone.owner_id,
        `Milestone payment of ₹${Number(milestone.amount).toLocaleString(
          "en-IN",
        )} has been released. Transaction: ${txHash}`,
        "MILESTONE_PAYMENT",
      ],
    );
  }

  return transaction.rows[0];
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  refundSecurityDeposit,
  releaseMilestonePayment,
};
