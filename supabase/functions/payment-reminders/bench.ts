async function runBenchmark() {
  const TOTAL_PAYMENTS = 100;

  // Mock function for simulating Supabase HTTP inserts
  const mockInsert = async (payload: unknown) => {
    // Simulate network delay (e.g. 50ms per request)
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { error: null };
  };

  const overduePayments = Array.from({ length: TOTAL_PAYMENTS }, (_, i) => ({
    payment_message_id: `msg_${i}`,
    debtor_user_id: `user_${i}`,
    amount_owed: 50.0 + i,
  }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  console.log(`Starting benchmark for ${TOTAL_PAYMENTS} payments...`);

  // N+1 Method (Current)
  const startNPlus1 = Date.now();
  let nPlus1Reminders = 0;

  for (const _ of overduePayments) {
    const { error: auditError } = await mockInsert();
    if (!auditError) {
      nPlus1Reminders++;
    }
  }
  const endNPlus1 = Date.now();
  const durationNPlus1 = endNPlus1 - startNPlus1;

  // Batched Method (Optimized)
  const startBatched = Date.now();

  const auditLogsToInsert = overduePayments.map((payment) => ({
    payment_message_id: payment.payment_message_id,
    action: 'reminder_sent',
    metadata: {
      debtor_user_id: payment.debtor_user_id,
      amount_owed: payment.amount_owed,
      days_overdue: Math.floor(
        (Date.now() - new Date(sevenDaysAgo).getTime()) / (1000 * 60 * 60 * 24),
      ),
    },
  }));

  // One single network request
  await mockInsert(auditLogsToInsert);

  const endBatched = Date.now();
  const durationBatched = endBatched - startBatched;

  console.log(`--- Results ---`);
  console.log(`N+1 Duration: ${durationNPlus1}ms`);
  console.log(`Batched Duration: ${durationBatched}ms`);
  console.log(`Improvement: ${(durationNPlus1 / durationBatched).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
