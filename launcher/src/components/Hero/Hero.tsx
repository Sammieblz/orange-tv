import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { HeroContent } from "@/data/seedHome.ts";
import styles from "./Hero.module.css";

interface HeroProps {
  content: HeroContent;
  focused: boolean;
}

export function Hero({ content, focused }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);

  const style =
    content.backgroundImageUrl != null
      ? {
          backgroundImage: `linear-gradient(90deg, rgba(10, 10, 10, 0.92) 0%, rgba(10, 10, 10, 0.4) 55%, transparent 100%), url(${content.backgroundImageUrl})`,
        }
      : undefined;

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        scale: focused ? 1.02 : 1,
        filter: focused ? "brightness(1.06)" : "brightness(1)",
        duration: focused ? 0.15 : 0.6,
        ease: "power2.out",
        overwrite: "auto",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [focused]);

  return (
    <section
      ref={rootRef}
      className={focused ? styles.heroFocused : styles.hero}
      style={style}
      aria-label="Featured"
    >
      <div className={styles.inner}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
      </div>
    </section>
  );
}
