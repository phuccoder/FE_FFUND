import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebSocketClient } from '../utils/Websocket-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wsClient, setWsClient] = useState(null);

  useEffect(() => {

    if (!isAuthenticated) {
      console.log('🔌 Not authenticated or user not ready — disconnecting WebSocket');
      wsClient?.disconnect();
      setWsClient(null);
      return;
    }

    // Already connected — don't reconnect
    if (wsClient) return;

    const client = new WebSocketClient({
      serverUrl: 'https://quanbeo.duckdns.org/ws',
      onMessage: handleNotification,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        var userId= localStorage.getItem('userId')
        const destination = `/user/${userId}/notification`;
        client.subscribe(destination);
        console.log('📩 Subscribed to:', destination);
      },
      onDisconnect: () => {
        console.warn('⚠️ WebSocket disconnected');
        setConnectionStatus('disconnected');
      },
    });

    client.connect();
    setWsClient(client);

    return () => {
      client.disconnect();
      setWsClient(null);
    };
  }, [isAuthenticated]);

  const handleNotification = (notification) => {
    const data = typeof notification === 'string' ? JSON.parse(notification) : notification;

    setNotifications((prev) => [data, ...prev]);
    setUnreadCount((prev) => prev + 1);

    toast.info(
      <div>
        <strong>{data.title}</strong>
        <p>{data.message || 'You have a new notification'}</p>
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
      }
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
