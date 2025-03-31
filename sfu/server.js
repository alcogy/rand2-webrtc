const express = require('express');
const bodyParser = require('body-parser');
const webrtc = require('wrtc');
const WebSocket = require('ws');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sessions = new Map();
const streams = new Map();
const existing = new Map();

const ws = new WebSocket.Server({ port: 9999, path:'/' });
ws.on('connection', async (socket, request) => {
    const socketKey = request.headers['sec-websocket-key'];
    console.log('connected', socketKey)
    const pc = new webrtc.RTCPeerConnection();
    pc.addTransceiver('audio');
    pc.addTransceiver('video');

    const peerOffer = async (peer, socket) => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.send(JSON.stringify({ event: 'offer', data: offer }));
    }

    const signaling = () => {
        // TODO: Implement lock process.
        sessions.forEach((session, sessionKey) => {
            streams.forEach((stream, key) => {
                const exists = existing.get(sessionKey)
                if ((!exists || !exists.includes(key)) && sessionKey !== key) {
                    stream.getTracks().forEach(track => {
                        session.pc.addTrack(track, stream);
                    });
                    const ex = [key];
                    const exis = exists === undefined ? ex : ex.concat(exists);
                    existing.set(sessionKey, exis);
                }
            });
            peerOffer(session.pc, session.socket);
        });
    }

    sessions.set(socketKey, { socket: socket, pc: pc });
    peerOffer(pc, socket);
    
    socket.on('message', async (message) => {
        const msg = JSON.parse(message.toString());
        switch (msg.event) {
            case 'answer':
                const sdp = new webrtc.RTCSessionDescription(msg.data);
                await pc.setRemoteDescription(sdp);
            break;
            case 'icecandidate':
                console.log('icecandidate');
                pc.addIceCandidate(msg.data);
            break;
        }
    });

    socket.on('close', () => {
        // TODO: Implement closing process.
        // signaling();
    });

    // TODO: Reimplement correctly
    let needSignaling = false;
    pc.ontrack = (e) => {
        streams.set(socketKey, e.streams[0]);
        if (needSignaling) {
            signaling();
            needSignaling = false;
        } else {
            needSignaling = true;
        }   
    }
});

app.listen(9000, () => console.log("server start at :9000"));