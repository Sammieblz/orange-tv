import type { HeroContent } from "../../data/seedHome";
import styles from "./Hero.module.css";

interface HeroProps {
  content: HeroContent;
  focused: boolean;
}

export function Hero({ content, focused }: HeroProps) {
  const style =
    content.backgroundImageUrl != null
      ? {
          backgroundImage: `linear-gradient(90deg, rgba(10, 10, 10, 0.92) 0%, rgba(10, 10, 10, 0.4) 55%, transparent 100%), url(${content.backgroundImageUrl})`,
        }
      : undefined;

  return (
    <section
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
