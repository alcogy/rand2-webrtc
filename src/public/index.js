'use strict'

async function webRTC() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const peer = new RTCPeerConnection()
            
    stream.getTracks().forEach(track => {
        peer.addTrack(track, stream)
    })
    
    const ws = new WebSocket('ws://localhost:9999')
    ws.onopen = async () => {
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        ws.send(JSON.stringify(offer))
    }
    ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data)
        switch (data.type) {
            case 'offer':
                const sdpOffer = new RTCSessionDescription(data)
                await peer.setRemoteDescription(sdpOffer)
                const answer = await peer.createAnswer()
                await peer.setLocalDescription(answer)
                ws.send(JSON.stringify(answer))
            break

            case 'answer':
                createVideoElement() 
                const sdpAnswer = new RTCSessionDescription(data)
                await peer.setRemoteDescription(sdpAnswer)
            break

            case 'new-ice-candidate': 
                try {
                    await peer.addIceCandidate(data.candidate)
                } catch(e) {
                    console.error('Add Ice Candidate error:', e)
                }
            break
        }
    }
    
    peer.addEventListener('icecandidate', (e) => {
        if (e.candidate) {
            ws.send(JSON.stringify({ type: 'new-ice-candidate', candidate: e.candidate }))
        }
    })

    peer.addEventListener('icegatheringstatechange', (e) => {
        if (peer.iceGatheringState === 'new') {
            createVideoElement()
        }
    })

    peer.addEventListener('track', (e) => {
        const videos = document.getElementsByTagName('video')
        const video = videos[videos.length - 1]
        const [stream] = e.streams
        video.srcObject = stream
    })

    const createVideoElement = () => {
        const video = document.createElement("video")
        video.srcObject = stream
        video.autoplay = true
        const wrap = document.getElementById("wrap")
        wrap.appendChild(video)
    }
}

