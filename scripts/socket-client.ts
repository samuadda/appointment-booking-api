import { io } from 'socket.io-client';

const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('slot.booked', (payload) => {
  console.log('slot.booked', payload);
});

socket.on('slot.released', (payload) => {
  console.log('slot.released', payload);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
