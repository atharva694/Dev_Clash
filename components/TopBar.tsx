import { Bell, Search } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-20 w-full flex items-center justify-end px-8 bg-transparent z-40 relative">
      <div className="flex items-center gap-5">
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute 1 top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full border border-[#0B0F19]"></span>
        </button>
        <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white border-2 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer">
          DU
        </div>
      </div>
    </header>
  );
}
