import type { ReactElement } from "react";
import type { VariantSummaryDTO } from "../lib/productTypes.js";
import styles from "./DiamondTypeToggle.module.css";

interface DiamondTypeToggleProps {
  options: VariantSummaryDTO[];
  currentDiamondType: string | null;
  onSelect: (variant: VariantSummaryDTO) => void;
}

// shortenDiamondType("Lab-Grown Diamond") -> "Lab-Grown"
function shortenDiamondType(diamondType: string): string {
  return diamondType.replace(/\s*Diamond$/i, "");
}

export function DiamondTypeToggle({
  options,
  currentDiamondType,
  onSelect
}: DiamondTypeToggleProps): ReactElement | null {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={styles.field}>
      <span>
        Diamond Type: <strong>{currentDiamondType}</strong>
      </span>
      <div className={styles.pills}>
        {options.map((option) => {
          const isSelected = option.diamondType === currentDiamondType;
          return (
            <button
              key={option.itemId}
              type="button"
              aria-pressed={isSelected}
              className={isSelected ? styles.pillSelected : styles.pill}
              onClick={() => {
                if (!isSelected) {
                  onSelect(option);
                }
              }}
            >
              {shortenDiamondType(option.diamondType ?? "")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
