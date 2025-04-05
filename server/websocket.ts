
import { WebSocket, WebSocketServer } from 'ws';
import { storage } from './storage';
import { Server } from 'http';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  
  const courses = new Map<number, Set<WebSocket>>();
  const users = new Map<number, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `ws://${req.headers.host}`);
    
    if (url.pathname.startsWith('/ws/chat/')) {
      const courseId = parseInt(url.pathname.split('/').pop()!);
      if (!courses.has(courseId)) {
        courses.set(courseId, new Set());
      }
      courses.get(courseId)!.add(ws);
      
      ws.on('close', () => {
        courses.get(courseId)?.delete(ws);
      });
      
      ws.on('message', async (data) => {
        const message = JSON.parse(data.toString());
        const savedMessage = await storage.createChatMessage(message);
        
        courses.get(courseId)?.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(savedMessage));
          }
        });
      });
    }
    
    if (url.pathname === '/ws/notifications') {
      const userId = parseInt(url.searchParams.get('userId')!);
      users.set(userId, ws);
      
      ws.on('close', () => {
        users.delete(userId);
      });
    }
  });
  
  return {
    notifyUser: (userId: number, notification: any) => {
      const ws = users.get(userId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(notification));
      }
    }
  };
}
