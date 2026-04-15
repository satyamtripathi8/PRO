import { Outlet } from "react-router-dom";
import BrandingPanel from "./BrandingPanel";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side */}
      <div className="  md:flex w-1/2 pl-20 bg-gradient-to-br from-cyan-500 to-blue-600">
        <BrandingPanel
          title="Learn • Trade • Grow"
          subtitle="Learn proven trading strategies. Practice risk-free. Grow with confidence."
        />
      </div>

      {/* Right Side */}
      <div className="flex flex-1 items-center justify-center bg-gray-100 p-6">
        <Outlet></Outlet>
      </div>
    </div>
  );
}