import { useState, type FormEvent, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendJson } from "../lib/apiClient.js";
import { formatPrice } from "../lib/catalogQuery.js";
import { useCart } from "../contexts/CartContext.js";
import { AddressForm } from "../components/AddressForm.js";
import type { OrderDTO, ShippingAddressInput } from "../lib/orderTypes.js";
import styles from "./CheckoutPage.module.css";

const EMPTY_ADDRESS: ShippingAddressInput = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: ""
};

export function CheckoutPage(): ReactElement {
  const { cart, isLoading, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.emptyState}>Your cart is empty.</p>
        <Link to="/wedding-rings" className={styles.continueLink}>
          Continue Shopping
        </Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await sendJson<OrderDTO>("POST", "/api/orders", { shippingAddress: address });
      await refresh();
      navigate(`/order-confirmation/${order.orderId}`);
    } catch {
      setSubmitError("Something went wrong placing your order. Please check your details and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>

      <div className={styles.layout}>
        <form className={styles.formSection} onSubmit={(event) => void handleSubmit(event)}>
          <h2 className={styles.sectionTitle}>Shipping Address</h2>
          <AddressForm value={address} onChange={setAddress} />

          {submitError && <p className={styles.submitError}>{submitError}</p>}

          <button type="submit" className={styles.placeOrderButton} disabled={isSubmitting}>
            {isSubmitting ? "Placing Order…" : "Place Order"}
          </button>
        </form>

        <aside className={styles.summary}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <ul className={styles.summaryItems}>
            {cart.items.map((item) => (
              <li key={item.itemId} className={styles.summaryItem}>
                <span>
                  <span>{item.name}</span> × {item.quantity}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.subtotalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
