const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/Chravel-Inc/chravel-web/pulls/203',
  method: 'GET',
  headers: {
    'User-Agent': 'node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('pr_203.json', data);
    console.log('Saved to pr_203.json');
  });
}).end();

const commentsOptions = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/Chravel-Inc/chravel-web/pulls/203/comments',
  method: 'GET',
  headers: {
    'User-Agent': 'node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.request(commentsOptions, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('pr_203_comments.json', data);
    console.log('Saved to pr_203_comments.json');
  });
}).end();

const issueCommentsOptions = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/Chravel-Inc/chravel-web/issues/203/comments',
  method: 'GET',
  headers: {
    'User-Agent': 'node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.request(issueCommentsOptions, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('pr_203_issue_comments.json', data);
    console.log('Saved to pr_203_issue_comments.json');
  });
}).end();
