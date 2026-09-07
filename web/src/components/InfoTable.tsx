import type { ReactElement } from "react";
import styles from "./InfoTable.module.css";

interface InfoTableRow {
  label: string;
  value: string;
}

interface InfoTableProps {
  rows: InfoTableRow[];
}

export function InfoTable({ rows }: InfoTableProps): ReactElement {
  return (
    <dl className={styles.table}>
      {rows.map((row) => (
        <div className={styles.row} key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
