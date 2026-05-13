import { Link } from "react-router-dom";

const LAST_UPDATED = "May 2026";

export default function Terms() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link to="/login" className="inline-block">
          <p className="text-amber font-semibold text-sm tracking-[10px] mb-8">
            O N C E
          </p>
        </Link>

        <h1 className="font-bold text-3xl text-text-primary tracking-tight">
          Terms of Service
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Service description">
          <p>
            Once is a hosted restaurant management platform that unifies
            orders from delivery platforms, dine-in service, and takeaway,
            and provides reporting, staff and menu management for
            UAE-based restaurants. Once connects on the restaurant's behalf
            to <strong>Talabat</strong>, <strong>Deliveroo</strong> and{" "}
            <strong>InstaShop</strong>.
          </p>
        </Section>

        <Section title="2. Restaurant owner responsibilities">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Provide accurate restaurant information at setup, including
              valid trade-licence-aligned business name and location.
            </li>
            <li>
              Hold and renew the platform credentials needed to connect
              Talabat, Deliveroo and InstaShop.
            </li>
            <li>
              Keep the menu, stock and pricing data up to date. Once will
              push availability changes to connected platforms but cannot
              authorise legal sale conditions on the restaurant's behalf.
            </li>
            <li>
              Comply with all applicable UAE food-safety, hygiene, VAT and
              labour regulations.
            </li>
          </ul>
        </Section>

        <Section title="3. Staff account management">
          <p>
            The owner account is responsible for every staff account
            created within the restaurant tenant. The owner must remove
            staff who no longer work at the restaurant, rotate temporary
            passwords promptly, and protect the owner PIN. Once is not
            liable for unauthorised access that results from leaked staff
            credentials or PINs.
          </p>
        </Section>

        <Section title="4. Platform integration terms">
          <p>
            Once acts as a technical processor between the restaurant and
            its delivery platforms. Each platform's own merchant agreement
            (commission, payout schedule, dispute process) continues to
            apply. Once does not collect or hold customer payment-card
            data — payments are settled directly between the platform and
            the restaurant under the platform's terms. Cash, card and
            wallet totals recorded in Till Reconciliation are summary
            figures only.
          </p>
        </Section>

        <Section title="5. Payment terms">
          <p>
            The subscription fee is <strong>USD 50 per month per
            restaurant</strong>, billed monthly in advance. The first
            14 days are free. Either party may cancel with 30 days'
            written notice; pre-paid fees are non-refundable. UAE VAT
            is added where applicable.
          </p>
        </Section>

        <Section title="6. Data processing agreement">
          <p>
            Once processes personal data as a Data Processor on the
            restaurant's behalf, in accordance with UAE Federal
            Decree-Law No. 45 of 2021 (PDPL). The full processing
            schedule lives in the <Link to="/privacy" className="text-amber hover:opacity-80">Privacy Policy</Link>.
            Sub-processors currently used: Google Cloud (hosting), Sentry
            (error monitoring). Customer data does not leave the UAE
            region unless explicitly authorised.
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            To the maximum extent permitted by UAE law, Once's aggregate
            liability for any claim arising out of or relating to the
            service is limited to the fees paid by the restaurant during
            the twelve months preceding the claim. Once is not liable for
            indirect, incidental, consequential or punitive damages, lost
            profits, or platform outages caused by third-party services
            (Talabat, Deliveroo, InstaShop, hosting providers).
          </p>
        </Section>

        <Section title="8. Term and termination">
          <p>
            These terms remain in effect until terminated by either
            party. We may suspend the service for unpaid invoices,
            breach of these terms, or where required by law. On
            termination, the restaurant retains access to data export
            for 30 days.
          </p>
        </Section>

        <Section title="9. Governing law">
          <p>
            These terms are governed by the laws of the United Arab
            Emirates. Any dispute is subject to the exclusive
            jurisdiction of the courts of Dubai.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Operational: <strong>support@once.app</strong>. Legal /
            data-protection: <strong>privacy@once.app</strong>.
          </p>
        </Section>

        <p className="text-text-muted text-xs mt-12 text-center">
          See also{" "}
          <Link to="/privacy" className="text-amber hover:opacity-80">
            Privacy Policy
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
