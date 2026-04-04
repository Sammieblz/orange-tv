import type { ComponentType, SVGProps } from "react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { AppWindow, BookStack, HomeSimple, Settings } from "iconoir-react";
import type { NavItem } from "@/data/seedHome.ts";
import type { FocusSection } from "@/store/focusStore.ts";
import styles from "./Sidebar.module.css";

const navIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  home: HomeSimple,
  library: BookStack,
  apps: AppWindow,
  settings: Settings,
};

const iconSize = 24;
const WIDTH_COLLAPSED = 72;
const WIDTH_EXPANDED = 200;

const iconProps = {
  className: styles.icon,
  width: iconSize,
  height: iconSize,
  strokeWidth: 1.5,
  color: "currentColor" as const,
};

interface SidebarProps {
  items: NavItem[];
  section: FocusSection;
  sidebarIndex: number;
}

function NavIcon({ id }: { id: string }) {
  const Icon = navIcons[id] ?? AppWindow;
  return <Icon {...iconProps} />;
}

export function Sidebar({ items, section, sidebarIndex }: SidebarProps) {
  const expanded = section === "sidebar";
  const railRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    }, railRef);
    return () => ctx.revert();
  }, [expanded]);

  return (
    <nav
      ref={railRef}
      className={`${styles.rail} ${expanded ? styles.railExpanded : ""}`}
      aria-label="Main"
      data-expanded={expanded ? "true" : "false"}
      style={{ width: WIDTH_COLLAPSED }}
    >
      <ul className={styles.list}>
        {items.map((item, i) => {
          const focused = section === "sidebar" && sidebarIndex === i;
          const activeHome = (section === "hero" || section === "row") && i === 0;
          return (
            <li key={item.id}>
              <div
                className={
                  focused ? styles.itemFocused : activeHome ? styles.itemActive : styles.item
                }
                aria-label={item.label}
                aria-current={activeHome && !focused ? "page" : undefined}
              >
                <span className={styles.iconWrap} aria-hidden>
                  <NavIcon id={item.id} />
                </span>
                <span className={styles.label}>{item.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
