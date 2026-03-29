import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userName={user?.name || "User"} userAvatar="" />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="p-4 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}