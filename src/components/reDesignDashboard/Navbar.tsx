import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/LOGO.svg";
import { Menu, X, LogIn } from "lucide-react";

type NavbarProps = {
  onFaqClick?: () => void;
};

export default function Navbar({ onFaqClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const navigate = useNavigate();

  // Redirect to login/signup page
  const handleAuth = () => {
    navigate("/auth/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22 lg:h-24">
          {/* LEFT - Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Trevoros Fintech"
              className="object-contain h-14 sm:h-16 lg:h-18"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold sm:text-xl lg:text-2xl text-slate-900">
                TREVOROS
              </span>
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] tracking-[0.25em] text-slate-500 uppercase">
                FINTECH
              </span>
            </div>
          </div>

          {/* DESKTOP BUTTONS */}
          <div className="items-center hidden gap-4 md:flex">
            {/* MVP Live Button - Clean Design */}
            <button
              onClick={handleAuth}
              className="relative inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm lg:text-base shadow-md hover:shadow-lg transition-all duration-300 border border-green-500">
              {/* Live indicator dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>MVP Live</span>
            </button>

            <button
              onClick={onFaqClick}
              className="
                px-6 py-3 rounded-3xl 
                border border-slate-300 
                bg-white text-slate-700 
                text-base font-medium 
                lg:text-lg
                transition-all duration-300 ease-in-out
                md:hover:bg-slate-50 md:hover:border-slate-400
                active:bg-slate-100
              "
            >
              FAQ
            </button>

            <button
              onClick={handleAuth}
              className="
                px-7 py-3 rounded-3xl 
                bg-gradient-to-r from-blue-600 to-purple-600 
                text-white 
                text-base font-semibold 
                lg:text-lg
                flex items-center gap-2
                transition-all duration-300 ease-in-out
                md:hover:shadow-lg md:hover:scale-105
                active:scale-100
              "
            >
              <LogIn size={20} />
              Sign In / Log In
            </button>
          </div>

          {/* MOBILE TOGGLE */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 transition rounded-lg hover:bg-slate-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300
          ${isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-5 py-5 space-y-3 bg-white border-t shadow-md border-slate-100">
          {/* MVP Live Button - Mobile */}
          <button
            onClick={() => { setIsOpen(false); handleAuth(); }}
            className="relative inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-base shadow-md transition-all duration-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>MVP Live Now</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onFaqClick?.();
            }}
            className="w-full px-4 py-3 font-medium text-left transition rounded-lg text-slate-700 hover:bg-slate-50"
          >
            FAQ
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              handleAuth();
            }}
            className="w-full px-5 py-3 font-semibold transition rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 text-base"
          >
            <LogIn size={20} />
            Sign In / Log In
          </button>
        </div>
      </div>
    </nav>
  );
}
