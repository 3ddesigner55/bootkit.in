import CustomerCounter from '../models/customerCounter.model';

/**
 * Safely and atomically allocates the next customer code sequence.
 * The first generated code is guaranteed to be BK-1001.
 * Uses padStart(4, '0') for zero-padding sequences < 1000, though our sequence starts at 1000.
 */
export async function allocateCustomerCode(): Promise<string> {
  // 1. Try to find the counter document
  let counter = await CustomerCounter.findOne({ _id: 'customerCode' });

  if (!counter) {
    try {
      // 2. Initialize sequence to 1000 (so the first increment yields 1001)
      counter = await CustomerCounter.create({ _id: 'customerCode', seq: 1000 });
    } catch (err: any) {
      if (err.code === 11000) {
        // Handle concurrent creation race: find the document initialized by the other process
        counter = await CustomerCounter.findOne({ _id: 'customerCode' });
        if (!counter) {
          throw new Error('Concurrent initialization failed: customerCode counter not found.');
        }
      } else {
        throw err;
      }
    }
  }

  // 3. Atomically increment the sequence counter
  const updated = await CustomerCounter.findOneAndUpdate(
    { _id: 'customerCode' },
    { $inc: { seq: 1 } },
    { new: true }
  );

  if (!updated) {
    throw new Error('Failed to atomically increment customerCode sequence.');
  }

  return `BK-${String(updated.seq).padStart(4, '0')}`;
}
