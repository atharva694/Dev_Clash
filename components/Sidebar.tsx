import { Home, Code2, Settings } from "lucide-react";

interface SidebarProps {
  currentView?: "generator" | "projects";
  setCurrentView?: (view: "generator" | "projects") => void;
}

export function Sidebar({ currentView = "generator", setCurrentView }: SidebarProps) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-[#0B0F19] flex flex-col pt-6 pb-6 z-50">
      <div className="px-6 flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span className="text-white font-bold text-xl tracking-wide">Nexus AI</span>
      </div>

      <div className="px-4 mb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2 mb-3">Menu</p>
        <div className="flex flex-col gap-1">
          <NavItem 
            icon={<Home className="w-4 h-4"/>} 
            label="Home" 
            active={currentView === "generator"} 
            onClick={() => setCurrentView?.("generator")}
          />
          <NavItem 
            icon={<Code2 className="w-4 h-4"/>} 
            label="Projects" 
            active={currentView === "projects"} 
            onClick={() => setCurrentView?.("projects")}
          />
          <NavItem 
            icon={<Settings className="w-4 h-4"/>} 
            label="Settings" 
          />
        </div>
      </div>

      <div className="mt-auto px-4">
        <div className="p-4 rounded-2xl bg-[#131825] border border-white/5">
          <h4 className="text-white text-sm font-semibold mb-1">Pro Plan</h4>
          <p className="text-slate-400 text-xs mb-3 leading-relaxed">Get access to advanced AI models.</p>
          <button className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-medium ${
        active 
          ? "bg-white/5 border border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

