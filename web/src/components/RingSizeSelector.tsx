import { useState, type ReactElement } from "react";
import styles from "./RingSizeSelector.module.css";

const MIN_SIZE = 3;
const MAX_SIZE = 13;
const RING_SIZES: number[] = [];
for (let size = MIN_SIZE; size <= MAX_SIZE; size += 0.5) {
  RING_SIZES.push(size);
}

export function RingSizeSelector(): ReactElement {
  const [size, setSize] = useState("");

  return (
    <label className={styles.field}>
      <span>Ring Size:</span>
      <select value={size} onChange={(event) => setSize(event.target.value)}>
        <option value="">Select</option>
        {RING_SIZES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
