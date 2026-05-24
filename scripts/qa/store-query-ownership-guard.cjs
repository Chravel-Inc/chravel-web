#!/usr/bin/env node
const fs = require('fs');

const storeFile = 'src/store/notificationRealtimeStore.ts';
const hookFile = 'src/hooks/useNotificationRealtime.ts';

const store = fs.readFileSync(storeFile, 'utf8');
const hook = fs.readFileSync(hookFile, 'utf8');

if (/notifications\s*:\s*\[/.test(store)) {
  console.error('❌ Guard failed: notification store cannot own notifications array.');
  process.exit(1);
}

if (!/queryClient\.setQueryData<NotificationCacheItem\[]>\(\['notifications'/.test(hook)) {
  console.error('❌ Guard failed: realtime path must patch notifications Query cache.');
  process.exit(1);
}

console.log('✅ Store/query ownership guard passed.');
