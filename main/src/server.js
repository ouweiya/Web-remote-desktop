const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const users = {};

const sendTo = (ws, message) => ws.send(JSON.stringify(message));

wss.on('connection', ws => {
  console.log('用户连接');

  ws.on('message', message => {
    let data = null;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('无效JSON', error);
      data = {};
    }

    switch (data.type) {
      case 'login':
        console.log('用户登录:', data.username);
        if (users[data.username]) {
          sendTo(ws, { type: 'login', success: false });
        } else {
          users[data.username] = ws;
          ws.username = data.username;
          sendTo(ws, { type: 'login', success: true });
        }
        break;
      case 'offer':
        console.log('发送邀请: ', data.otherUsername);
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername;
          sendTo(users[data.otherUsername], {
            type: 'offer',
            offer: data.offer,
            username: ws.username
          });
        }
        break;
      case 'answer':
        console.log('发送回复: ', data.otherUsername);
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername;
          sendTo(users[data.otherUsername], {
            type: 'answer',
            answer: data.answer
          });
        }
        break;
      case 'candidate':
        console.log('发送候选人:', data.otherUsername);
        if (users[data.otherUsername] != null) {
          sendTo(users[data.otherUsername], {
            type: 'candidate',
            candidate: data.candidate
          });
        }
        break;
      case 'close':
        console.log('断开: ', data.otherUsername);
        users[data.otherUsername].otherUsername = null;
        if (users[data.otherUsername] != null) sendTo(users[data.otherUsername], { type: 'close' });
        break;
      default:
        sendTo(ws, { type: 'error', message: 'Command not found: ' + data.type });
        break;
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      delete users[ws.username];
      if (ws.otherUsername) {
        console.log('断开: ', ws.otherUsername);
        users[ws.otherUsername].otherUsername = null;
        if (users[ws.otherUsername] != null) sendTo(users[ws.otherUsername], { type: 'close' });
      }
    }
  });
});
