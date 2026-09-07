import type { CSSProperties, ReactElement } from "react";
import { getMetalColor } from "../lib/metalColors.js";
import type { VariantSummaryDTO } from "../lib/productTypes.js";
import styles from "./MetalSwatchSelector.module.css";

interface MetalSwatchSelectorProps {
  options: VariantSummaryDTO[];
  currentMetal: string | null;
  onSelect: (variant: VariantSummaryDTO) => void;
}

export function MetalSwatchSelector({
  options,
  currentMetal,
  onSelect
}: MetalSwatchSelectorProps): ReactElement | null {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={styles.field}>
      <span>
        Metal Type: <strong>{currentMetal}</strong>
      </span>
      <div className={styles.swatches}>
        {options.map((option) => {
          const isSelected = option.metal === currentMetal;
          return (
            <button
              key={option.itemId}
              type="button"
              aria-label={option.metal ?? undefined}
              aria-pressed={isSelected}
              className={isSelected ? styles.swatchSelected : styles.swatch}
              style={{ "--swatch-color": getMetalColor(option.metal ?? "") } as CSSProperties}
              onClick={() => {
                if (!isSelected) {
                  onSelect(option);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
