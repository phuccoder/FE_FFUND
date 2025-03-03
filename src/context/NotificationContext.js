import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebSocketClient } from '../utils/Websocket-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsClient, setWsClient] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      // Connect to WebSocket server
      const client = new WebSocketClient(
        'ws://localhost:8080/ws',
        `/user/${user.userId}/notifications`,
        handleNotification
      );

      client.connect();
      setWsClient(client);

      // Cleanup on unmount
      return () => {
        if (client) {
          client.disconnect();
        }
      };
    }
  }, [isAuthenticated, user?.userId]);

  // Handle incoming notifications
  const handleNotification = (notification) => {
    console.log('Received notification:', notification);
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast.info(
      <div>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }
    );
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Recalculate unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    // Send read status to server
    if (wsClient) {
      wsClient.sendMessage('/app/notifications/markAsRead', {
        notificationId,
        userId: user?.userId
      });
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
    
    // Send read status to server
    if (wsClient) {
      wsClient.sendMessage('/app/notifications/markAllAsRead', {
        userId: user?.userId
      });
    }
  };

  // Value to be provided by the context
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);