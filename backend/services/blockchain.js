const crypto = require("crypto");

function generateTxHash() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

async function refundSecurityDeposit({ pool, bid, ownerId }) {
  console.log("BLOCKCHAIN REFUND STARTED FOR BID:", bid.id);
  const txHash = generateTxHash();

  // Record simulated blockchain transaction
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

module.exports = {
  refundSecurityDeposit,
};
