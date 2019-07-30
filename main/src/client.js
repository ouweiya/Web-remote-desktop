const load = _ => {
  const url = 'ws://66.42.68.93:7777';
  const ws = new WebSocket(url);
  // const ws = new WebSocket('ws://localhost:7777');
  ws.onerror = err => console.error(err);

  let handleOffer = null;
  let handleAnswer = null;
  let handleCandidate = null;
  let handleClose = null;
  let main = null;
  let other = null;
  const ul = document.querySelector('ul');
  const submit = document.querySelector('#submit');
  const txt = document.querySelector('#txt');

  ws.onmessage = ({ data }) => {
    const d = JSON.parse(data);
    switch (d.type) {
      case 'offer':
        handleOffer(d);
        break;
      case 'answer':
        handleAnswer(d);
        break;
      case 'candidate':
        handleCandidate(d.candidate);
        break;
      case 'close':
        handleClose();
        break;
      default:
        break;
    }
  };
  const configuration = { iceServers: [{ url: 'stun:stun2.1.google.com:19302' }] };

  const throttle = (callback => {
    let oldTime = 0;
    return callback => {
      const newDate = +new Date();
      if (newDate - oldTime > 100) {
        callback();
        oldTime = newDate;
      }
    };
  })();

  document.querySelector('#start').style.display = 'none';
  ws.onopen = () => {
    console.log('连接到信令服务器');
    ws.send(JSON.stringify({ type: 'login', user: 'other' }));
  };
  let o = null;
  let ice = null;
  let c = null;
  handleOffer = offer => {
    c = new RTCPeerConnection(configuration);
    c.onaddstream = e => {
      console.log('stream', e.stream);
      document.querySelector('video').srcObject = e.stream;
      document.querySelector('video').onloadedmetadata = e => video.play();
      console.dir(document.querySelector('video'));
    };

    c.setRemoteDescription(new RTCSessionDescription(offer));
    c.createAnswer().then(answer => {
      o = answer;
      ws.send(JSON.stringify(o));
      c.setLocalDescription(answer);
    });
    other = c.createDataChannel('Hello-2.html');
    c.ondatachannel = e => {
      const res = e.channel;
      res.onmessage = e => {
        const mes = JSON.parse(e.data);
        const li = document.createElement('li');
        li.textContent = `对方: ${mes}`;
        ul.append(li);
        console.log(mes);
        ul.scrollTo(0, ul.scrollHeight);
      };
      res.onopen = e => {
        console.log('通道打开了');
        document.addEventListener('mousemove', e => {
          const point = { x: e.clientX, y: e.clientY };
          other && throttle(_ => other.send(JSON.stringify({ type: 'point', point })));
        });

        document.addEventListener('click', e => {
          other && throttle(_ => other.send(JSON.stringify({ type: 'click' })));
        });
      };
    };
  };
  handleCandidate = candidate => {
    c.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('candidate', candidate);
  };
  document.querySelector('#stop').addEventListener('click', _ => {
    c && c.close();
    ws.send(JSON.stringify({ type: 'close', user: 'main' }));
    c = null;
    other = null;
  });
  handleClose = _ => {
    c.close();
    document.querySelector('video').srcObject = null;
    o = null;
    ice = null;
    c = null;
    other = null;
  };
  submit.addEventListener('click', _ => {
    other.send(JSON.stringify(txt.value));
    const li = document.createElement('li');
    li.textContent = `我: ${txt.value}`;
    ul.append(li);
    txt.value = '';

    ul.scrollTo(0, ul.scrollHeight);
  });
};

document.addEventListener('DOMContentLoaded', load);
