import { useState, type ChangeEvent, type ReactElement } from "react";
import { fetchJson } from "../lib/apiClient.js";
import type { GeocodedAddressDTO, ShippingAddressInput } from "../lib/orderTypes.js";
import styles from "./AddressForm.module.css";

type LocationStatus = "idle" | "locating";

interface AddressFormProps {
  value: ShippingAddressInput;
  onChange: (value: ShippingAddressInput) => void;
}

export function AddressForm({ value, onChange }: AddressFormProps): ReactElement {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState<string | null>(null);

  function handleFieldChange(field: keyof ShippingAddressInput, event: ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, [field]: event.target.value });
  }

  function handleUseMyLocation(): void {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Location is not supported by your browser. Please enter your address manually.");
      return;
    }

    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchJson<GeocodedAddressDTO>(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`)
          .then((geocoded) => {
            onChange({ ...value, ...geocoded });
          })
          .catch(() => {
            setLocationError("Couldn't determine your address from your location. Please enter it manually.");
          })
          .finally(() => setLocationStatus("idle"));
      },
      () => {
        setLocationError("Couldn't access your location. Please enter your address manually.");
        setLocationStatus("idle");
      }
    );
  }

  return (
    <div className={styles.form}>
      <button
        type="button"
        className={styles.locateButton}
        onClick={handleUseMyLocation}
        disabled={locationStatus === "locating"}
      >
        {locationStatus === "locating" ? "Locating…" : "Use My Location"}
      </button>
      {locationError && <p className={styles.locationError}>{locationError}</p>}

      <label className={styles.field}>
        <span>Full Name</span>
        <input value={value.name} onChange={(event) => handleFieldChange("name", event)} required />
      </label>

      <label className={styles.field}>
        <span>Address Line 1</span>
        <input value={value.line1} onChange={(event) => handleFieldChange("line1", event)} required />
      </label>

      <label className={styles.field}>
        <span>Address Line 2 (optional)</span>
        <input value={value.line2 ?? ""} onChange={(event) => handleFieldChange("line2", event)} />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>City</span>
          <input value={value.city} onChange={(event) => handleFieldChange("city", event)} required />
        </label>
        <label className={styles.field}>
          <span>State</span>
          <input value={value.state} onChange={(event) => handleFieldChange("state", event)} required />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Postal Code</span>
          <input value={value.postalCode} onChange={(event) => handleFieldChange("postalCode", event)} required />
        </label>
        <label className={styles.field}>
          <span>Country</span>
          <input value={value.country} onChange={(event) => handleFieldChange("country", event)} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Phone (optional)</span>
        <input value={value.phone ?? ""} onChange={(event) => handleFieldChange("phone", event)} />
      </label>
    </div>
  );
}
