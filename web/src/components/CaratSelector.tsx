import type { ChangeEvent, ReactElement } from "react";
import type { VariantSummaryDTO } from "../lib/productTypes.js";
import styles from "./CaratSelector.module.css";

interface CaratSelectorProps {
  options: VariantSummaryDTO[];
  currentCarat: number | null;
  onSelect: (variant: VariantSummaryDTO) => void;
}

export function CaratSelector({ options, currentCarat, onSelect }: CaratSelectorProps): ReactElement | null {
  if (options.length <= 1) {
    return null;
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    const chosen = options.find((option) => String(option.totalCarat) === event.target.value);
    if (chosen) {
      onSelect(chosen);
    }
  }

  return (
    <label className={styles.field}>
      <span>Total Carat Weight</span>
      <select value={currentCarat ?? ""} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.itemId} value={option.totalCarat ?? ""}>
            {option.totalCarat} ct
          </option>
        ))}
      </select>
    </label>
  );
}
