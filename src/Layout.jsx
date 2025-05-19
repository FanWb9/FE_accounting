import React from "react";
import SideBar from "./SideBar/SideBar";
import Navbar from "./SideBar/Navbar"; // Import the Navbar component
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Navbar */}
      <Navbar />
      
      {/* Add a spacer div to prevent content from being hidden under the navbar */}
      <div className="h-14"></div> {/* Adjust height to match your navbar height */}
      
      <div className="flex flex-1">
        {/* Your modified SideBar is already fixed */}
        <SideBar />
        
        {/* Main content */}
        <main className="flex-1   overflow-y-auto">
          <Outlet /> {/* This will render the component based on the route */}
        </main>
      </div>
    </div>
  );
};

export default Layout;