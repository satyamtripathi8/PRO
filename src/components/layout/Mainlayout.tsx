import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-x-hidden">
      <Sidebar userName={user?.name || "User"} userAvatar="" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}