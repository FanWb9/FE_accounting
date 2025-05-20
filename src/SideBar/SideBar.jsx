import React, { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Package,
  Factory,
  Briefcase,
  BarChart2,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../assets/Fin.png";

export default function SideBar() {
  const [open, setOpen] = useState(false); // Default to closed

  const menus = [
    { name: "Dashboard", link: "/pengeluaran", icon: LayoutDashboard },
    { name: "Kas & Bank", link: "/pengeluaran", icon: Wallet },
    { name: "Penjualan", link: "/pengeluaran", icon: ShoppingBag },
    { name: "Pembelian", link: "/pengeluaran", icon: ShoppingCart, margin: true },
    { name: "Produk", link: "/pengeluaran", icon: Package },
    { name: "Produksi", link: "/pengeluaran", icon: Factory },
    { name: "Aset", link: "/pengeluaran", icon: Briefcase, margin: true },
    { name: "Laporan", link: "/pengeluaran", icon: BarChart2 },
    { name: "Setting", link: "/pengeluaran", icon: Settings },
  ];

  return (
    <section className="flex">
      <div
        className={`bg-blue-950 min-h-screen fixed ${
          open ? "w-72" : "w-16"
        } duration-500 text-gray-100 px-4`}
      >
        <div className="py-5 flex justify-end">
          <Menu
            size={26}
            className="cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <div className="mt-4 flex flex-col gap-4 relative">
          {menus.map((menu, i) => (
            <Link
              to={menu.link}
              key={i}
              className={`${
                menu.margin && "mt-5"
              } group flex items-center text-sm gap-3.5 font-medium p-2 hover:bg-sky-400 rounded-md`}
            >
              <div>{React.createElement(menu.icon, { size: 20 })}</div>
              <h2
                style={{ transitionDelay: `${i + 3}00ms` }}
                className={`whitespace-pre duration-500 ${
                  !open && "opacity-0 translate-x-28 overflow-hidden"
                }`}
              >
                {menu.name}
              </h2>
              <h2
                className={`${
                  open && "hidden"
                } absolute left-48 bg-white font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 w-0 overflow-hidden group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit`}
              >
                {menu.name}
              </h2>
            </Link>
          ))}
        </div>
      </div>
      {/* This empty div creates space for the fixed sidebar */}
      <div className={`${open ? "w-72" : "w-16"} flex-shrink-0 duration-500`}></div>
    </section>
  );
}