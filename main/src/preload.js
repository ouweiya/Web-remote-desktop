const { desktopCapturer } = require('electron');
const robot = require('robotjs');
console.log(process.versions);

const load = _ => {
  const ws = new WebSocket('ws://localhost:8080');
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

  if (location.hash !== '#other') {
    ws.onopen = () => {
      console.log('连接到信令服务器');
      ws.send(JSON.stringify({ type: 'login', user: 'main' }));
    };
    const start = _ => {
      let o = null;
      let ice = null;
      let stream = null;
      const c = new RTCPeerConnection(configuration);

      desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        for (const source of sources) {
          if (source.name === 'Entire screen') {
            try {
              const res = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id,
                    minWidth: 1280,
                    maxWidth: 1280,
                    minHeight: 720,
                    maxHeight: 720
                  }
                }
              });
              stream = res;
              c.addStream(res);
              document.querySelector('video').srcObject = res;
              c.onicecandidate = e => {
                if (e.candidate) {
                  ice = e.candidate;
                  console.log(e.candidate);
                  ws.send(JSON.stringify({ type: 'candidate', candidate: ice }));
                }
              };
              main = c.createDataChannel('hello-1.html');
              c.ondatachannel = e => {
                const res = e.channel;
                res.onmessage = e => {
                  const li = document.createElement('li');
                  const mes = JSON.parse(e.data);
                  console.log(mes);

                  if (mes.type === 'point') {
                    const { x, y } = mes.point;
                    console.log(x, y);
                    // robot.moveMouse(x, y);
                  } else if (mes.type === 'click') {
                    console.log('click');
                  } else {
                    li.textContent = `对方: ${e.data}`;
                    ul.append(li);
                  }
                };
                res.onopen = e => console.log('通道打开了');
              };
              c.createOffer().then(offer => {
                c.setLocalDescription(offer);
                o = offer;
                console.log(o);
                ws.send(JSON.stringify(o));
              });
            } catch (e) {
              console.log(error.name, error);
            }
          }
        }
      });

      handleAnswer = answer => {
        c.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(answer);
      };
      document.querySelector('#stop').addEventListener('click', _ => {
        c.close();
        stream.getTracks().forEach(track => track.stop());
        document.querySelector('video').srcObject = null;
        ws.send(JSON.stringify({ type: 'close', user: 'other' }));
      });
      handleClose = _ => {
        c.close();
        stream.getTracks().forEach(track => track.stop());
        document.querySelector('video').srcObject = null;
      };
    };

    document.querySelector('#start').addEventListener('click', start);

    submit.addEventListener('click', _ => {
      main.send(JSON.stringify(txt.value));
      const li = document.createElement('li');
      li.textContent = `我: ${txt.value}`;
      ul.append(li);
      txt.value = '';
    });
  } else {
    document.querySelector('#start').style.display = 'none';
    document.querySelector('#a').style.display = 'none';
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
          const li = document.createElement('li');
          li.textContent = `对方: ${e.data}`;
          ul.append(li);
          console.log(e.data);
        };
        res.onopen = e => {
          console.log('通道打开了');
          document.addEventListener('mousemove', e => {
            const point = { x: e.clientX, y: e.clientY };
            throttle(_ => other.send(JSON.stringify({ type: 'point', point })));
          });

          document.addEventListener('click', e => {
            throttle(_ => other.send(JSON.stringify({ type: 'click' })));
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
    });
    handleClose = _ => {
      c.close();
      document.querySelector('video').srcObject = null;
      o = null;
      ice = null;
      c = null;
    };
    submit.addEventListener('click', _ => {
      other.send(JSON.stringify(txt.value));
      const li = document.createElement('li');
      li.textContent = `我: ${txt.value}`;
      ul.append(li);
      txt.value = '';
    });
  }
};

document.addEventListener('DOMContentLoaded', load);
// npm rebuild robotjs --update-binary
