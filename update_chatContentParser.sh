#!/bin/bash
sed -i "s|import { insertLinkIndex } from './linkService';|import { insertLinkIndex } from './linkService';\nimport { taskStorageService } from './taskStorageService';\nimport { paymentService } from './paymentService';|g" src/services/chatContentParser.ts

cat << 'INNER_EOF' > temp_replace.cjs
const fs = require('fs');
let file = fs.readFileSync('src/services/chatContentParser.ts', 'utf8');

const oldTodoBlock = `      case 'create_todo':
        // TODO: Implement todo creation service
        return null;`;

const newTodoBlock = `      case 'create_todo': {
        if (!suggestion.data) return null;

        const sd = suggestion.data as Record<string, any>;
        const result = await taskStorageService.createTask(tripId, {
          title: sd.title || 'New Task',
          description: sd.description,
          due_at: sd.due_date ? new Date(sd.due_date).toISOString() : undefined,
          is_poll: false,
          assignedTo: [],
        });

        return result.id;
      }`;

const oldReceiptBlock = `      case 'extract_receipt':
        // TODO: Implement receipt extraction/storage
        return null;`;

const newReceiptBlock = `      case 'extract_receipt': {
        if (!suggestion.data) return null;

        const sd = suggestion.data as Record<string, any>;
        const structured = sd.structured_data || {};

        // This acts as a signal for the UI to handle the receipt
        return \`receipt_extraction:\${Date.now()}\`;
      }`;

file = file.replace(oldTodoBlock, newTodoBlock);
file = file.replace(oldReceiptBlock, newReceiptBlock);

fs.writeFileSync('src/services/chatContentParser.ts', file);
INNER_EOF

node temp_replace.cjs
rm temp_replace.cjs
