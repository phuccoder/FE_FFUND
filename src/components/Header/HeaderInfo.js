import React, { useState, useEffect } from "react";
import { useRootContext } from "@/context/context";
import SearchIcon from "./SearchIcon";
import Social from "./Social";
import { ChevronDown, LogOut, User, FileText, Users, ClipboardList } from "lucide-react";
import jwt_decode from "jwt-decode";
import { authenticate } from "@/utils/authenticate";
import Link from "../Reuseable/Link";
 

const HeaderInfo = ({ socials, searchColor }) => {
  const { toggleMenu, toggleSearch } = useRootContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setIsLoggedIn(true);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const menuItems = {
    FOUNDER: [
      { label: 'Profile', icon: User, href: '/profile' },
      { label: 'Funded Project', icon: FileText, href: '/funded-projects' },
      { label: 'Request/Report', icon: ClipboardList, href: '/requests' }
    ],
    INVESTOR: [
      { label: 'Profile', icon: User, href: '/profile' },
      { label: 'Funded Project', icon: FileText, href: '/funded-projects' },
      { label: 'Request/Report', icon: ClipboardList, href: '/requests' },
      { label: 'Team Management', icon: Users, href: '/team' }
    ]
  };

  return (
    <div className="header-info d-flex align-items-center">
      {socials && <Social socials={socials} />}
      <div className="search d-none d-lg-block">
        <a className="cursor-pointer" onClick={toggleSearch}>
          <SearchIcon color={searchColor} />
        </a>
      </div>

      {isLoggedIn ? (
        <div className="info d-none d-sm-block relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <User size={20} />
            <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              {menuItems[userRole]?.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <a
                    key={index}
                    href={item.href}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ItemIcon size={16} className="mr-2" />
                    {item.label}
                  </a>
                );
              })}
              <button
                onClick={authenticate.logout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="info d-none d-sm-block">
          <Link href="/login-register" className="text-gray-700 hover:text-gray-900">
            Login/Register
          </Link>
        </div>
      )}

      <div
        onClick={toggleMenu}
        className="toggle-btn ml-30 canvas_open d-lg-none d-block"
      >
        <i className="fa fa-bars"></i>
      </div>
    </div>
  );
};

export default HeaderInfo;