import styles from "./page.module.css";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.hero}>
        <h1 className={styles.title}>AI-Powered Assessment System</h1>
        <p className={styles.subtitle}>
          Practice theory and coding questions, get instant feedback, and accelerate your learning with AI assistance.
        </p>
        <div className={styles.buttonGroup}>
          <Link href="/main" className={styles.primaryButton}>
            Get Started
          </Link>
          <Link href="/survey" className={styles.secondaryButton}>
            Participate in Survey
          </Link>
        </div>
      </div>
    </div>
  );
}