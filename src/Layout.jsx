// src/Layout.js
import React from "react";
import SideBar from "./SideBar/SideBar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex">
      <SideBar />
      <div className="flex-1">
        <Outlet /> {/* Ini akan merender komponen berdasarkan route */}
      </div>
    </div>
  );
};

export default Layout;
