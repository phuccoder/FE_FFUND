import React, { useState } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'react-feather';
import { useNotifications } from '@/context/NotificationContext';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [show, setShow] = useState(false);

  const handleToggle = (isOpen) => {
    setShow(isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate or perform action based on notification type
    // Example: router.push(notification.link)
  };

  return (
    <Dropdown show={show} onToggle={handleToggle} align="end">
      <Dropdown.Toggle 
        as="div" 
        className="position-relative d-flex align-items-center" 
        style={{ cursor: 'pointer' }}
      >
        <Bell size={24} color="#FF8C00" />
        {unreadCount > 0 && (
          <Badge 
            pill 
            bg="danger" 
            className="position-absolute" 
            style={{ 
              top: '-8px', 
              right: '-8px',
              fontSize: '0.65rem',
              minWidth: '18px',
              minHeight: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflow: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="btn btn-sm"
              style={{ color: '#FF8C00' }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p className="mb-0">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Dropdown.Item 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={`px-3 py-2 border-bottom ${!notification.read ? 'bg-light' : ''}`}
            >
              <div className="d-flex">
                <div 
                  className="rounded-circle me-3 flex-shrink-0" 
                  style={{ 
                    backgroundColor: notification.read ? '#e9ecef' : '#FF8C00',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: notification.read ? '#495057' : 'white'
                  }}
                >
                  <i className={`fa ${notification.icon || 'fa-bell'}`}></i>
                </div>
                <div>
                  <div className="fw-bold">{notification.title}</div>
                  <div className="text-muted small">{notification.message}</div>
                  {notification.createdAt && (
                    <div className="text-muted small mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;