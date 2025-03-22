import React from "react";
import { IoHomeOutline } from "react-icons/io5";
import { FaRegUserCircle, FaRegCalendarAlt, FaUserAlt } from "react-icons/fa";
import { MdOutlineOndemandVideo, MdOutlineCampaign } from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { RiMickeyLine } from "react-icons/ri";
import { FiSettings } from "react-icons/fi";
import { AiOutlineCreditCard } from "react-icons/ai";
import { HiX } from "react-icons/hi";
import Image from "next/image";
import Link from "next/link";

export default function Sidebar({ showSidebar, setShowSidebar }) {
  const navItems = [
    { name: "AI UGC avatars", icon: FaUserAlt },
    { name: "AI UGC ads", icon: MdOutlineOndemandVideo },
    { name: "Schedule", icon: FaRegCalendarAlt },
    { name: "Campaigns", icon: MdOutlineCampaign },
  ];

  const bottomNavItems = [
    { name: "Support", icon: BiSupport },
    { name: "Billing", icon: AiOutlineCreditCard },
    { name: "Settings", icon: FiSettings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowSidebar((showSidebar) => !showSidebar)
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 
        w-64 bg-white border-r border-gray-200 
        h-screen overflow-y-auto transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button for mobile */}
      <div className="flex flex-col">
      <div className="md:hidden flex justify-end px-4 pt-4">
          <button 
            onClick={() => {
              setShowSidebar((showSidebar) => !showSidebar)
            }}
            className="p-2 rounded-full hover:bg-gray-100 "
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="p-4">
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Image 
                src="/logo.svg" 
                alt="Reddit Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <span className="text-lg font-bold">RedditScheduler</span>
          </Link>
        </div>
        </div>

        <div className="flex-1 flex flex-col justify-between h-[calc(92%-72px)] md:h-[calc(100%-72px)]">
          {/* Top Navigation */}
          <div className="py-2">
            <Link href="/dashboard" className="flex items-center text-white bg-blue-500 mx-3 px-4 py-3 rounded-lg mb-2">
              <IoHomeOutline className="w-5 h-5 mr-3" />
              <span>Home</span>
            </Link>

            <nav className="mt-2">
              {navItems.map((item, index) => (
                <Link href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`} key={index} className="flex items-center text-gray-600 hover:bg-gray-100 mx-3 px-4 py-3 rounded-lg">
                  <item.icon className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Section */}
          <div>
            {/* Bottom Navigation */}
            <nav className="py-2">
              {bottomNavItems.map((item, index) => (
                <Link href={`/${item.name.toLowerCase()}`} key={index} className="flex items-center text-gray-600 hover:bg-gray-100 mx-3 px-4 py-3 rounded-lg">
                  <item.icon className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Usage Meter */}
            <div className="mx-3 p-4 bg-blue-50 rounded-lg my-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-blue-600 font-medium">
                  0 videos remaining
                </span>
              </div>
              <p className="text-sm text-blue-600 mb-2">Resets in 2 days</p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-0"></div>
              </div>
            </div>

            {/* User Profile */}
          <div className="p-4 border-t border-gray-200 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                <FaRegUserCircle className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-500">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
