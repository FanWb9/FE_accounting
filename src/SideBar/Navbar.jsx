import React, { useState, useEffect } from "react";
import { Bell, User, ChevronDown, LogOut, Settings, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Navbar() {
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Get user data from sessionStorage on component mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        
        // Set company data directly from the user object if it exists
        if (parsedUser.company) {
          setCompanyData(parsedUser.company);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('company');
    navigate('/login');
    toast.info("Anda telah keluar dari sistem");
  };
 
  return (
    <div className="bg-sky-500 border-b shadow-sm z-30 fixed top-0 left-0 right-0">
      <div className="flex justify-between items-center px-4 py-3">
        {/* Brand Logo - Left Side */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <h1 className="text-xl font-bold text-white">FinNo</h1>
        </div>

        {/* User Name, Profile, and Bell - Right Side */}
        <div className="flex items-center gap-4">
          {userData ? (
            <div className="relative dropdown-container">
              <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={toggleDropdown}
              >
                {/* User Name */}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{userData.name}</p>
                </div>
                
                {/* User Profile Icon */}
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                
                <ChevronDown 
                  size={16} 
                  className={`text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </div>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-base font-medium text-gray-900">{userData.name}</p>
                    {companyData && (
                      <p className="text-sm text-gray-500">{companyData.name}</p>
                    )}
                  </div>
                  
                  <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User size={16} className="mr-2" />
                    Profil
                  </a>
                  
                  <a href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings size={16} className="mr-2" />
                    Pengaturan
                  </a>
                  
                  <a href="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <HelpCircle size={16} className="mr-2" />
                    Bantuan
                  </a>
                  
                  <div className="border-t">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">Guest User</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <ChevronDown size={16} className="text-white" />
            </div>
          )}
          
          {/* Bell Icon */}
          <button className="relative">
            <Bell size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              10
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}