
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

export default function CourseChat({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      
      if (response.ok) {
        setNewMessage("");
        // Обновить сообщения
        fetchMessages();
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Добавить здесь WebSocket подключение для real-time чата
  }, [courseId]);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-[400px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 mb-4 ${
                message.senderId === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-white">
                  {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-[70%] ${
                  message.senderId === user?.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className="text-sm font-medium mb-1">{message.senderName}</div>
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {format(new Date(message.timestamp), 'HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex gap-2 mt-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage}>Отправить</Button>
        </div>
      </CardContent>
    </Card>
  );
}
