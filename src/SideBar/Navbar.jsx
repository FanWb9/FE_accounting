import React from "react";
import { Bell, User, ChevronDown } from "lucide-react";
import Logo from "../assets/Fin.png";

export default function Navbar() {
  // You can toggle between these two logo options
  const useLogo = true; // Set to false to use the letter "F" instead of an image logo
  
  return (
    <div className="bg-sky-500 border-b shadow-sm z-30 fixed top-0 left-0 right-0">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <h1 className="text-xl font-bold text-white">FinNo</h1>

        </div>

        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              10
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">Admin User</p>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}