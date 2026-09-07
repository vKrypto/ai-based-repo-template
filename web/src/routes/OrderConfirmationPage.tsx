import { useEffect, useState, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, fetchJson } from "../lib/apiClient.js";
import { formatPrice } from "../lib/catalogQuery.js";
import type { OrderDTO } from "../lib/orderTypes.js";
import styles from "./OrderConfirmationPage.module.css";

type LoadStatus = "loading" | "ready" | "not-found" | "error";

export function OrderConfirmationPage(): ReactElement {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    if (!orderId) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetchJson<OrderDTO>(`/api/orders/${orderId}`)
      .then((response) => {
        if (cancelled) return;
        setOrder(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(error instanceof ApiError && error.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === "not-found") {
    return (
      <main className={styles.page}>
        <p>This order could not be found.</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className={styles.page}>
        <p>Something went wrong loading your order. Please try again.</p>
      </main>
    );
  }

  if (status === "loading" || !order) {
    return (
      <main className={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Thank you for your order!</h1>
      <p className={styles.orderNumber}>Order #{order.orderId}</p>

      <div className={styles.layout}>
        <section>
          <h2 className={styles.sectionTitle}>Items</h2>
          <ul className={styles.items}>
            {order.items.map((item, index) => (
              <li key={item.itemId ?? index} className={styles.item}>
                <span>
                  <span>{item.name}</span> × {item.quantity}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.subtotalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Shipping To</h2>
          <address className={styles.address}>
            <span className={styles.addressLine}>{order.shippingAddress.name}</span>
            <span className={styles.addressLine}>{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 && (
              <span className={styles.addressLine}>{order.shippingAddress.line2}</span>
            )}
            <span className={styles.addressLine}>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </span>
            <span className={styles.addressLine}>{order.shippingAddress.country}</span>
          </address>
        </section>
      </div>

      <Link to="/wedding-rings" className={styles.continueLink}>
        Continue Shopping
      </Link>
    </main>
  );
}
