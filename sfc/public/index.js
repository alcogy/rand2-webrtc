'use strict'

const btn = document.querySelector("#btn");
btn.addEventListener("click", () => {
    btn.disabled = true;
    webRTC();
});

const webRTC = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const pc = new RTCPeerConnection();
    
    pc.ontrack = (e) => {
        if (e.streams.length === 0 || e.track.kind === 'audio') return;
        const v = document.createElement('video');
        v.srcObject = e.streams[0];
        v.autoplay = true;
        const videoWrap = document.querySelector("#videoWrap");
        videoWrap.appendChild(v);
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const ws = new WebSocket('ws://localhost:9999');
    ws.onmessage = async (message) => {
        const msg = JSON.parse(message.data)
        switch (msg.event) {
            case 'offer':
                console.log('offer');
                const sdp = new RTCSessionDescription(msg.data);
                await pc.setRemoteDescription(sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({ event: 'answer', data: pc.localDescription }));
            break;

            case 'icecandidate': 
                console.log('get icecandidate');
                await peer.addIceCandidate(msg.data);
            break;
        }
    }

    

    // pc.addEventListener('connectionstatechange', (e) => {

    //     console.log('connectionstatechange', pc.connectionState);
    // });
    // pc.addEventListener('icecandidate', (e) => {
    //     console.log('icecandidate', e);
    // });
    // pc.addEventListener('icecandidateerror', (e) => {
    //     console.log('icecandidateerror', e);
    // });
    // pc.addEventListener('iceconnectionstatechange', (e) => {
    //     console.log('iceconnectionstatechange', e);
    // });
    // pc.addEventListener('icegatheringstatechange', (e) => {
    //     console.log('icegatheringstatechange', e);
    // });
    // pc.addEventListener('negotiationneeded', (e) => {
    //     console.log('negotiationneeded', e);
    // });
    // pc.addEventListener('signalingstatechange', async (e) => {
    //     console.log('signalingstatechange', pc.signalingState);
    // });
}