

  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  
  useEffect(() => {
    if (!course) return;
    
    const ws = new WebSocket(`ws://${window.location.host}/ws/presence/${course.id}`);
    
    ws.onmessage = (event) => {
      const { users } = JSON.parse(event.data);
      setOnlineUsers(users);
    };
    
    return () => ws.close();
  }, [course]);
