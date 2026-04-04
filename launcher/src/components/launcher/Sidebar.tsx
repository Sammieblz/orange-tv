import type { ComponentType, SVGProps } from "react";
import { AppWindow, BookStack, HomeSimple, Settings } from "iconoir-react";
import type { NavItem } from "../../data/seedHome";
import type { FocusSection } from "../../store/focusStore";
import styles from "./Sidebar.module.css";

const navIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  home: HomeSimple,
  library: BookStack,
  apps: AppWindow,
  settings: Settings,
};

const iconSize = 24;

interface SidebarProps {
  items: NavItem[];
  section: FocusSection;
  sidebarIndex: number;
}

function NavIcon({ id }: { id: string }) {
  const Icon = navIcons[id] ?? AppWindow;
  return (
    <Icon
      className={styles.icon}
      width={iconSize}
      height={iconSize}
      strokeWidth={1.5}
      color="currentColor"
    />
  );
}

export function Sidebar({ items, section, sidebarIndex }: SidebarProps) {
  const expanded = section === "sidebar";

  return (
    <nav
      className={`${styles.rail} ${expanded ? styles.railExpanded : ""}`}
      aria-label="Main"
      data-expanded={expanded ? "true" : "false"}
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
