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

  const handleAuth = () => {
    navigate("/auth/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* LEFT — Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Trevoros Fintech"
              className="object-contain h-10 sm:h-11"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold sm:text-lg text-slate-900">
                TREVOROS
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.25em] text-slate-500 uppercase">
                FINTECH
              </span>
            </div>
          </div>

          {/* DESKTOP BUTTONS */}
          <div className="items-center hidden gap-3 md:flex">
            {/* MVP Live Button */}
            <button
              onClick={handleAuth}
              className="relative inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 border border-green-500"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>MVP Live</span>
            </button>

            <button
              onClick={onFaqClick}
              className="px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-sm font-medium transition-all duration-300 hover:bg-slate-50 hover:border-slate-400"
            >
              FAQ
            </button>

            <button
              onClick={handleAuth}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-100"
            >
              <LogIn size={16} />
              Sign In / Log In
            </button>
          </div>

          {/* MOBILE TOGGLE */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 transition rounded-lg hover:bg-slate-100"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-2.5 bg-white border-t shadow-md border-slate-100">
          {/* MVP Live — Mobile */}
          <button
            onClick={() => { setIsOpen(false); handleAuth(); }}
            className="relative inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all duration-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>MVP Live Now</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onFaqClick?.(); }}
            className="w-full px-4 py-2.5 text-sm font-medium text-left transition rounded-lg text-slate-700 hover:bg-slate-50"
          >
            FAQ
          </button>

          <button
            onClick={() => { setIsOpen(false); handleAuth(); }}
            className="w-full px-4 py-2.5 font-semibold transition rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <LogIn size={16} />
            Sign In / Log In
          </button>
        </div>
      </div>
    </nav>
  );
}
