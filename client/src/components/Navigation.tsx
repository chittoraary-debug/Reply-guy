import { Link, useLocation } from "wouter";
import { Home, Mic, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/record", icon: Mic, label: "Diary", primary: true },
    // { href: "/discover", icon: Compass, label: "Discover" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center">
      <div className="bg-white/90 backdrop-blur-lg border border-white/50 shadow-xl shadow-black/5 rounded-[2rem] px-6 py-3 flex items-center gap-8 pointer-events-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer group",
              item.primary ? "-mt-8" : "",
              location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <div className={cn(
                "flex items-center justify-center transition-all duration-300",
                item.primary 
                  ? "w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 group-hover:scale-105 group-active:scale-95" 
                  : "w-10 h-10 rounded-xl group-hover:bg-muted"
              )}>
                <item.icon 
                  size={item.primary ? 28 : 24} 
                  strokeWidth={item.primary ? 2.5 : 2}
                  className={cn(location === item.href && !item.primary && "fill-current/20")}
                />
              </div>
              {!item.primary && (
                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
