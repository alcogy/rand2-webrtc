import express from 'express'
import bodyParser from 'body-parser'
import WebSocket from 'ws'
import cors from 'cors'

const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

const sessions = new Map()

// Signaling server.
const ws = new WebSocket.Server({ port: 9999, path: '/' })
ws.on('connection', (socket, request) => {
    
    const socketKey = request.headers['sec-websocket-key']
    sessions.set(socketKey, socket)
    console.log('connected', sessions.size)
    
    socket.on('message', (msg) => {
        sessions.forEach((value, key) => {
            if (key !== socketKey) {
                value.send(msg.toString())
            }
        })
    })

    socket.on('close', () => {
        sessions.delete(socketKey);
        // TODO: send notice closed
        console.log('closed', sessions.size)
    })
})

app.listen(9000, () => console.log("server start at :9000"))