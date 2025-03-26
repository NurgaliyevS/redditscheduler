import React, { useEffect, useState } from "react";
import { IoHomeOutline } from "react-icons/io5";
import { FaRegUserCircle, FaRegCalendarAlt } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { FiTarget, FiSettings } from "react-icons/fi";
import { AiOutlineCreditCard, AiOutlineLineChart } from "react-icons/ai";
import { BsGraphUp } from "react-icons/bs";
import { BiCalendarCheck } from "react-icons/bi";
import { HiX } from "react-icons/hi";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { formatDistanceToNow } from "date-fns";

export default function Sidebar({ showSidebar, setShowSidebar }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingUrl, setBillingUrl] = useState("/#pricing");

  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    {
      name: "Scheduling",
      icon: BiCalendarCheck,
      href: "/dashboard/scheduling",
    },
    { name: "Cross-Posting", icon: FiTarget, href: "/dashboard/cross-posting" },
    {
      name: "Hook Generator",
      icon: AiOutlineLineChart,
      href: "/dashboard/hook-generator",
    },
    { name: "Analytics", icon: BsGraphUp, href: "/dashboard/analytics" },
  ];

  const bottomNavItems = [
    { name: "Support", icon: BiSupport, href: "/dashboard/support" },
    {
      name: "Billing",
      icon: AiOutlineCreditCard,
      href: billingUrl || "/#pricing",
    },
    { name: "Settings", icon: FiSettings, href: "/dashboard/settings" },
  ];

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch("/api/user/user");
        const userData = await response.json();
        setUser(userData);

        // Fetch billing portal URL
        if (userData?.name) {
          try {
            const portalResponse = await fetch('/api/create-portal-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: userData.name
              }),
            });
            
            const { url } = await portalResponse.json();
            setBillingUrl(url);
          } catch (error) {
            console.error('Error creating portal session:', error);
            setBillingUrl("/#pricing");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  const formatDate = () => {
    if (isLoading) return <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>;
    if (user?.ends_at) {
      return "Resets in " + formatDistanceToNow(new Date(user.ends_at));
    } else {
      return (
        <Link href="/#pricing" className="btn btn-primary btn-sm">
          Upgrade
        </Link>
      );
    }
  };

  const NavItemSkeleton = () => (
    <div className="flex items-center mx-3 px-4 py-3 rounded-lg">
      <div className="w-5 h-5 mr-3 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
    </div>
  );

  const UserProfileSkeleton = () => (
    <div className="p-4 border-t border-gray-200 flex items-center">
      <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse mr-3"></div>
      <div>
        <div className="h-4 w-24 bg-gray-200 animate-pulse mb-2"></div>
        <div className="h-3 w-32 bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowSidebar((showSidebar) => !showSidebar);
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-50 
        w-64 bg-white border-r border-gray-200 
        h-screen overflow-y-auto transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Close button for mobile */}
        <div className="flex flex-col">
          <div className="md:hidden flex justify-end px-4 pt-4">
            <button
              onClick={() => {
                setShowSidebar((showSidebar) => !showSidebar);
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
            {isLoading ? (
              <>
                <NavItemSkeleton />
                {navItems.map((_, index) => (
                  <NavItemSkeleton key={index} />
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/onboarding"
                  className={`flex items-center mx-3 px-4 py-3 rounded-lg mb-2 ${
                    currentPath === "/dashboard/onboarding"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <IoHomeOutline className="w-5 h-5 mr-3" />
                  <span>Home</span>
                </Link>

                <nav className="mt-2">
                  {navItems.map((item, index) => (
                    <Link
                      href={item.href}
                      key={index}
                      className={`flex items-center mx-3 px-4 py-3 rounded-lg ${
                        currentPath === item.href
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-3 ${
                          currentPath === item.href ? "text-white" : "text-gray-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </>
            )}
          </div>

          {/* Bottom Section */}
          <div>
            {/* Bottom Navigation */}
            <nav className="py-2">
              {isLoading ? (
                bottomNavItems.map((_, index) => (
                  <NavItemSkeleton key={index} />
                ))
              ) : (
                bottomNavItems.map((item, index) => (
                  item.name === "Billing" ? (
                    <a
                      key={index}
                      href={item.href}
                      className={`flex items-center mx-3 px-4 py-3 rounded-lg ${
                        currentPath === item.href
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-3 ${
                          currentPath === item.href ? "text-white" : "text-gray-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      key={index}
                      className={`flex items-center mx-3 px-4 py-3 rounded-lg ${
                        currentPath === item.href
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-3 ${
                          currentPath === item.href ? "text-white" : "text-gray-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  )
                ))
              )}
            </nav>

            {/* Usage Meter */}
            <div className="mx-3 p-4 bg-blue-50 rounded-lg my-4 h-32">
              {isLoading ? (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="h-4 w-32 bg-gray-200 animate-pulse my-4"></div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="w-1/2 bg-blue-500 h-2 rounded-full animate-pulse"></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-blue-600 font-medium">
                      {user?.post_available || 0} posts
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 my-4">{formatDate()}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      style={{
                        width: `${Math.min(
                          ((user?.post_available || 0) / 50) * 100,
                          100
                        )}%`,
                      }}
                      className="bg-blue-500 h-2 rounded-full"
                    ></div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            {isLoading ? (
              <UserProfileSkeleton />
            ) : (
              <div className="p-4 border-t border-gray-200 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  <FaRegUserCircle className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}