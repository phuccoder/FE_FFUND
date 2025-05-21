import React, { useState, useEffect } from "react";
import { useRootContext } from "@/context/context";
import SearchIcon from "./SearchIcon";
import Social from "./Social";
import { ChevronDown, LogOut, User, FileText, Users, ClipboardList, Mail, Bell, Container } from "lucide-react";
import { authenticate } from "src/services/authenticate";
import Link from "../Reuseable/Link";
import NotificationDropdown from "@/components/Notifications/NotificationDropdown";
import { FaMoneyBill, FaMoneyCheck } from "react-icons/fa";

const MENU_ITEMS = {
  FOUNDER: [
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Manage Project', icon: FileText, href: '/edit-project' },
    { label: 'Manage Team', icon: Users, href: '/team-members' },
    { label: 'Manage Invitation', icon: Mail, href: '/invitation' },
    { label: 'Transaction', icon: FaMoneyBill, href: '/founder-transaction' },
    { label: 'Investment Reward', icon: Container, href: '/investment-reward' },
    { label: 'Request', icon: ClipboardList, href: '/request-report' },
    { label: "Investment", icon: FileText, href: "/founder-investments" },
    { label: 'Payout', icon: FaMoneyCheck, href: '/payout' },
  ],
  INVESTOR: [
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Funded Project', icon: FileText, href: '/funded-projects' },
    { label: 'Report', icon: ClipboardList, href: '/request-report' },
    { label: 'Manage Reward', icon: Mail, href: '/reward' },
    { label: 'Investment', icon: FaMoneyBill, href: '/investment' }
  ]
};

const HeaderInfo = ({ socials, searchColor }) => {
  const { toggleMenu, toggleSearch } = useRootContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('role');
      
      console.log('Retrieved from localStorage - Role:', role);
      
      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    // Run immediately on mount
    checkAuthStatus();
    
    // Add storage event listener
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Log when userRole changes (useful for debugging)
  useEffect(() => {
    console.log('Current userRole state:', userRole);
  }, [userRole]);

  const handleLogout = async () => {
    try {
      await authenticate.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      setIsLoggedIn(false);
      setUserRole(null);
      setShowDropdown(false);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to determine which menu items to show
  const getMenuItems = () => {
    if (!userRole) {
      return [];
    }
    
    // Check if the exact role exists in our MENU_ITEMS
    if (MENU_ITEMS[userRole]) {
      return MENU_ITEMS[userRole];
    }
    
    // Alternative: the role might be in the format "ROLE_FOUNDER", so check for that
    const roleWithoutPrefix = userRole.replace('ROLE_', '');
    if (MENU_ITEMS[roleWithoutPrefix]) {
      return MENU_ITEMS[roleWithoutPrefix];
    }
    
    // Fallback to an empty array if no matching role is found
    return [];
  };

  return (
    <div className="header-info d-flex align-items-center">
      {socials && <Social socials={socials} />}

      {isLoggedIn ? (
        <>
          {/* Notification Dropdown */}
          <div className="notification-dropdown d-none d-sm-block ml-15">
            <NotificationDropdown />
          </div>

          <div className="info d-none d-sm-block relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              aria-expanded={showDropdown}
              aria-label="User menu"
            >
              <User size={20} />
              <ChevronDown size={16} />
            </button>

            {showDropdown && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                role="menu"
              >
                {getMenuItems().map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <ItemIcon size={16} className="mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  role="menuitem"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        // Login/Register button when user is not logged in
        <div className="d-none d-sm-block ml-15">
          <Link href="/login-register">
            <button className="main-btn main-btn-2">Login/Register</button>
          </Link>
        </div>
      )}

      <button
        onClick={toggleMenu}
        className="toggle-btn ml-30 canvas_open d-lg-none d-block bg-transparent border-0"
        aria-label="Toggle menu"
      >
        <i className="fa fa-bars"></i>
      </button>
    </div>
  );
};

export default HeaderInfo;