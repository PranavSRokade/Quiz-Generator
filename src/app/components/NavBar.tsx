"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../styles/layout.module.css";

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link
        href="/"
        className={pathname === "/" ? styles.activeLink : styles.link}
      >
        Home
      </Link>
      <Link
        href="/quiz"
        className={pathname === "/quiz" ? styles.activeLink : styles.link}
      >
        Quiz System
      </Link>
      <Link
        href="/survey"
        className={pathname === "/survey" ? styles.activeLink : styles.link}
      >
        Survey
      </Link>
    </nav>
  );
};

export default NavBar;