import { useState, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { FOOTER_LINK_GROUPS } from "../lib/staticPageLinks.js";
import styles from "./Footer.module.css";

const SOCIAL_ICONS: ReadonlyArray<{ label: string; path: string }> = [
  {
    label: "Instagram",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm5.25-1.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
  },
  {
    label: "Facebook",
    path: "M14 22v-8h2.7l.4-3H14V9.1c0-.87.24-1.46 1.5-1.46H17V5.08C16.72 5.04 15.76 5 14.64 5 12.3 5 10.7 6.42 10.7 9.06V11H8v3h2.7v8H14Z"
  },
  {
    label: "Twitter",
    path: "M21 6.4a7.3 7.3 0 0 1-2.1.58 3.7 3.7 0 0 0 1.6-2.03 7.3 7.3 0 0 1-2.32.89 3.65 3.65 0 0 0-6.22 3.33A10.36 10.36 0 0 1 4.6 5.15a3.65 3.65 0 0 0 1.13 4.87 3.6 3.6 0 0 1-1.65-.46v.05a3.65 3.65 0 0 0 2.93 3.58 3.7 3.7 0 0 1-1.64.06 3.66 3.66 0 0 0 3.41 2.54A7.33 7.33 0 0 1 3 17.4a10.3 10.3 0 0 0 5.6 1.64c6.72 0 10.4-5.57 10.4-10.4l-.01-.47A7.4 7.4 0 0 0 21 6.4Z"
  },
  {
    label: "YouTube",
    path: "M21.6 7.6a2.8 2.8 0 0 0-1.97-2C18 5.2 12 5.2 12 5.2s-6 0-7.63.4a2.8 2.8 0 0 0-1.97 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.4 2.8 2.8 0 0 0 1.97 2c1.63.4 7.63.4 7.63.4s6 0 7.63-.4a2.8 2.8 0 0 0 1.97-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.4ZM10 15V9l5.2 3-5.2 3Z"
  },
  {
    label: "LinkedIn",
    path: "M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 20h-3.37v-6.06c0-1.44-.03-3.3-2.01-3.3-2.02 0-2.33 1.58-2.33 3.2V20H9.36V8.5h3.24v1.57h.05c.45-.85 1.55-1.75 3.2-1.75 3.42 0 4.05 2.25 4.05 5.18V20Z"
  }
];

export function Footer(): ReactElement {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setSubscribed(true);
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        {FOOTER_LINK_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading} className={styles.group}>
            <h2 className={styles.heading}>{group.heading}</h2>
            <ul className={styles.list}>
              {group.links.map((link) => (
                <li key={link.slug}>
                  <Link to={`/${link.slug}`}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className={styles.newsletter}>
          <h2 className={styles.heading}>Stay In The Know</h2>
          <p className={styles.newsletterCopy}>Get our latest designs, updates and offers by email.</p>
          {subscribed ? (
            <p className={styles.newsletterThanks}>Thanks — we&rsquo;ll be in touch.</p>
          ) : (
            <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
              <label htmlFor="footer-newsletter-email" className={styles.srOnly}>
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="submit" aria-label="Subscribe">
                &rarr;
              </button>
            </form>
          )}

          <ul className={styles.social}>
            {SOCIAL_ICONS.map((icon) => (
              <li key={icon.label}>
                <span className={styles.socialIcon} role="img" aria-label={icon.label}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={icon.path} />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>&copy; {new Date().getFullYear()} Bare Brilliant</span>
      </div>
    </footer>
  );
}
