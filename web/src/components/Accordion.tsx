import { useState, type ReactElement, type ReactNode } from "react";
import styles from "./Accordion.module.css";

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({ title, defaultOpen = false, children }: AccordionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{title}</span>
        <span className={styles.icon} aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
