import { getOfflineDb, type OfflineQueuedOperation, type OfflineQueueStatus } from './db';

export type OfflineQueueEntityType = 'chat_message' | 'task' | 'calendar_event' | 'poll_vote';
export type OfflineQueueOperationType = 'create' | 'update' | 'delete';

async function getQueuedOperations(filters?: {
  status?: OfflineQueueStatus;
  tripId?: string;
  entityType?: OfflineQueueEntityType;
}): Promise<OfflineQueuedOperation[]> {
  const db = await getOfflineDb();
  let ops: OfflineQueuedOperation[];

  if (filters?.status) {
    ops = await db.getAllFromIndex('syncQueue', 'by-status', filters.status);
  } else {
    ops = await db.getAll('syncQueue');
  }

  if (filters?.tripId) ops = ops.filter(o => o.tripId === filters.tripId);
  if (filters?.entityType) ops = ops.filter(o => o.entityType === filters.entityType);

  return ops.sort((a, b) => a.timestamp - b.timestamp);
}

async function removeOperation(operationId: string): Promise<boolean> {
  const db = await getOfflineDb();
  try {
    await db.delete('syncQueue', operationId);
    return true;
  } catch {
    return false;
  }
}

export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  syncing: number;
  failed: number;
}> {
  const ops = await getQueuedOperations();
  return {
    total: ops.length,
    pending: ops.filter(o => o.status === 'pending').length,
    syncing: ops.filter(o => o.status === 'syncing').length,
    failed: ops.filter(o => o.status === 'failed').length,
  };
}

export async function clearAllQueuedOperations(): Promise<void> {
  const ops = await getQueuedOperations();
  await Promise.all(ops.map(op => removeOperation(op.id)));
}
