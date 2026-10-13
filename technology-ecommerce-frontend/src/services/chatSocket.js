import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  autoConnect: false,
})

export function connectChat(token) {
  socket.auth = { token }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export default socket
