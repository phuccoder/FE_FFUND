import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebSocketClient } from '../utils/Websocket-client';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wsClient, setWsClient] = useState(null);

  useEffect(() => {
    // Early return if not authenticated
    if (!isAuthenticated) {
      console.log('🔌 Not authenticated — disconnecting WebSocket');
      if (wsClient) {
        wsClient.disconnect();
        setWsClient(null);
      }
      return;
    }

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');

    // Early return if userId is not available
    if (!userId) {
      console.log('⚠️ User ID not available - cannot establish WebSocket connection');
      return;
    }

    // Already connected — don't reconnect
    if (wsClient) {
      console.log('🔄 WebSocket already connected');
      return;
    }

    console.log('🔄 Setting up new WebSocket connection for user:', userId);

    const client = new WebSocketClient({
      serverUrl: 'https://ffund.duckdns.org/ws',
      onMessage: handleNotification,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');

        // Create destination path with userId
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
      console.log('🧹 Cleaning up WebSocket connection');
      client.disconnect();
      setWsClient(null);
    };
  }, [isAuthenticated]);

  const handleNotification = (notification) => {
    try {
      console.log('📬 Received notification:', notification);

      // Parse the notification if it's a string
      let data = notification;
      if (typeof notification === 'string') {
        try {
          data = JSON.parse(notification);
        } catch (err) {
          console.error('Failed to parse notification JSON:', err);
        }
      }

      // Ensure we have a valid notification object
      if (!data || typeof data !== 'object') {
        console.error('Invalid notification format:', notification);
        return;
      }

      // Add notification to state
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Display toast with appropriate fallbacks for missing fields
      toast.info(
        <div>
          <strong>{data.title || 'New Notification'}</strong>
          <p>{data.message || data.content || 'You have a new notification'}</p>
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      console.log('🔔 Toast notification displayed');
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
      }}
    >
      <ToastContainer/>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);