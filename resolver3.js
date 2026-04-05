import fs from 'fs';
let content = fs.readFileSync('src/features/chat/components/TripChat.tsx', 'utf8');

const regex =
  / {10}setReactions\(formatted\);\n {8}\}\n {6}\}\n {8}setReactions\(formatted\);\n {6}\}\n {4}\};/g;
content = content.replace(regex, `          setReactions(formatted);\n        }\n      }\n    };`);

fs.writeFileSync('src/features/chat/components/TripChat.tsx', content);
