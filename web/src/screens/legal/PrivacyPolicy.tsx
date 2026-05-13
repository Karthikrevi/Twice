import { Link } from "react-router-dom";

const LAST_UPDATED = "May 2026";

export default function PrivacyPolicy() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link to="/login" className="inline-block">
          <p className="text-amber font-semibold text-sm tracking-[10px] mb-8">
            O N C E
          </p>
        </Link>

        <h1 className="font-bold text-3xl text-text-primary tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Scope and legal basis">
          <p>
            Once ("we", "the service") is a restaurant management platform
            operated for UAE-based restaurants. This Privacy Policy explains
            what personal data we collect, how we use it, and the rights you
            hold under <em>UAE Federal Decree-Law No. 45 of 2021 on the
            Protection of Personal Data</em> (the "PDPL"), as well as the
            executive regulations issued by the UAE Data Office.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account data</strong> — name, email, role (owner /
              manager / waiter / kitchen), bcrypt-hashed password, optional
              Google account identifier, owner PIN hash.
            </li>
            <li>
              <strong>Restaurant data</strong> — name, location, table layout,
              menu, stock counts, kitchen output preference.
            </li>
            <li>
              <strong>Order data</strong> — orders received from delivery
              platforms or opened in-restaurant, including item composition,
              totals, customer name and delivery address where the source
              platform provides them.
            </li>
            <li>
              <strong>Operational data</strong> — table sessions, payment
              records (cash / card / wallet method only — never card
              numbers), audit logs of sensitive actions, status changes,
              platform settlement history.
            </li>
            <li>
              <strong>Authentication artefacts</strong> — JWT access and
              refresh tokens stored client-side; session metadata server-side
              (issued-at, IP not retained).
            </li>
          </ul>
        </Section>

        <Section title="3. How we use it">
          <p>
            Personal data is processed solely to deliver the restaurant
            management service: routing orders to the kitchen and waiters,
            reconciling daily revenue, syncing menu availability to
            connected delivery platforms, generating reports for the
            restaurant owner, and supporting the audit log requirements
            of the PDPL. We do not sell personal data and we do not run
            advertising or behavioural-tracking pipelines.
          </p>
        </Section>

        <Section title="4. Platform integrations">
          <p>
            With your authorisation, Once connects to{" "}
            <strong>Talabat</strong>, <strong>Deliveroo</strong> and{" "}
            <strong>InstaShop</strong>. Vendor credentials are stored encrypted
            at rest with AES-256-GCM. Order data we receive from each platform
            is processed under the platform's own privacy terms, then merged
            into the unified Once order schema. Talabat and InstaShop both
            sit on the Delivery Hero vendor POS API.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            Subject to UAE Federal Tax Authority requirements, Once retains:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>Order records for 2 years (configurable per restaurant)</li>
            <li>Closed table-session metadata anonymised after 1 year</li>
            <li>Audit logs for 3 years</li>
            <li>
              Tax-relevant invoice data retained for 5 years per FTA Decree
              No. 36/2017 — personal identifiers are stripped after the
              standard order-retention window.
            </li>
          </ul>
          <p className="mt-3">
            A daily job sweeps each restaurant against these limits.
          </p>
        </Section>

        <Section title="6. Your rights under the PDPL">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Access</strong> — request a copy of the personal data
              we hold about you.
            </li>
            <li>
              <strong>Rectification</strong> — request correction of
              inaccurate data.
            </li>
            <li>
              <strong>Erasure</strong> — request deletion. Order records
              retained for tax compliance are anonymised rather than deleted.
            </li>
            <li>
              <strong>Restriction</strong> — limit how we process your data.
            </li>
            <li>
              <strong>Data portability</strong> — receive your data in a
              structured, machine-readable format (we use JSON).
            </li>
            <li>
              <strong>Objection</strong> — object to processing on
              legitimate-interest grounds.
            </li>
          </ul>
        </Section>

        <Section title="7. How to request export or deletion">
          <p>
            Signed-in owners can self-serve both operations from{" "}
            <strong>Settings → Data &amp; Privacy</strong>. The Export action
            returns a downloadable JSON file containing every personal record
            Once holds keyed off your user account. The Delete action
            anonymises personal identifiers for everyone in your restaurant
            and marks the restaurant deleted. Order rows are retained but
            personal identifiers are stripped.
          </p>
          <p className="mt-3">
            For staff accounts, or where you'd prefer a human in the loop,
            write to <strong>privacy@once.app</strong> and we'll respond
            within the 30-day window the PDPL requires.
          </p>
        </Section>

        <Section title="8. Breach notification">
          <p>
            If a personal-data breach occurs, we notify the UAE Data Office
            within <strong>72 hours</strong> of becoming aware of it, per
            Article 9 of the PDPL. Affected restaurants are notified by
            email and in-app banner as soon as practicable, with details of
            the data involved, the likely consequences, and the steps we are
            taking.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Data protection officer: <strong>privacy@once.app</strong>.
            Postal correspondence: Once, P.O. Box 123456, Dubai, UAE.
          </p>
        </Section>

        <p className="text-text-muted text-xs mt-12 text-center">
          By using Once you acknowledge this policy. See also{" "}
          <Link to="/terms" className="text-amber hover:opacity-80">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 text-text-primary text-[15px] leading-relaxed">
      <h2 className="text-text-primary font-semibold text-lg mb-3">
        {title}
      </h2>
      <div className="space-y-3 text-text-primary/90">{children}</div>
    </section>
  );
}
