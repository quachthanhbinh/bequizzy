import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — RevLooper",
  description:
    "Read the RevLooper Terms of Service to understand your rights and obligations when using our AI sales outreach platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="May 5, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the RevLooper
        website at <a href="https://revlooper.com">revlooper.com</a> and the RevLooper SaaS
        platform (collectively, the &ldquo;Service&rdquo;), operated by RevLooper Pte. Ltd.
        (&ldquo;RevLooper&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
      </p>
      <p>
        By creating an account or using the Service, you agree to these Terms. If you are
        accepting on behalf of a company or organisation, you represent that you have authority
        to bind that entity to these Terms.
      </p>

      <hr />

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and have the legal capacity to enter into a binding
        agreement in your jurisdiction to use the Service. The Service is intended for
        business-to-business (B2B) outreach and commercial use — not for personal,
        consumer, or household purposes.
      </p>

      <h2>2. Accounts &amp; Workspaces</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
        <li>You must promptly notify us of any unauthorised access to your account</li>
        <li>Each workspace is a separate tenant; you may not access or use another workspace&rsquo;s data</li>
        <li>One person may not share a single account across multiple individuals without a team-seat plan</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
      </ul>

      <h2>3. Acceptable Use</h2>

      <h3>3.1 Permitted Use</h3>
      <p>
        You may use the Service to create and send outreach campaigns, manage leads, book
        meetings, and operate B2B sales workflows for yourself or for clients of your
        organisation, subject to these Terms and all applicable laws.
      </p>

      <h3>3.2 Prohibited Use</h3>
      <p>You must not use the Service to:</p>
      <ul>
        <li>Send unsolicited commercial messages (spam) in violation of applicable anti-spam laws, including CAN-SPAM, CASL, and Vietnam&rsquo;s Circular 12/2022</li>
        <li>Contact individuals who have opted out, unsubscribed, or are on a suppression list</li>
        <li>Scrape, harvest, or bulk-collect personal data without a lawful basis</li>
        <li>Impersonate another person, company, or brand</li>
        <li>Upload malicious content, malware, or phishing material</li>
        <li>Circumvent sending limits, rate limits, or abuse detection mechanisms</li>
        <li>Use the Service for illegal pyramid schemes, MLM solicitations, or fraudulent offers</li>
        <li>Resell access to the Service without prior written authorisation from RevLooper</li>
        <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
        <li>Use AI-generated content to deceive recipients in a materially harmful way</li>
      </ul>
      <p>
        Violation of this section may result in immediate account suspension and, where
        required by law, reporting to relevant authorities.
      </p>

      <h2>4. AI-Generated Content</h2>
      <p>
        The Service uses large language models (LLMs) to generate email copy, reply suggestions,
        lead scores, and other content. You acknowledge that:
      </p>
      <ul>
        <li>AI-generated content may be inaccurate, incomplete, or unsuitable for your use case — always review before sending</li>
        <li>You are solely responsible for content you send to third parties, regardless of whether it was AI-generated</li>
        <li>RevLooper does not guarantee specific outcomes (reply rates, meetings booked, revenue generated) from AI-generated content</li>
        <li>You must not use AI-generated content in any way that violates applicable laws, including consumer protection and advertising standards</li>
      </ul>

      <h2>5. Your Data &amp; Lead Data</h2>
      <p>
        You retain ownership of all data you upload to the Service, including lead lists,
        AI Brain documents, and campaign content (&ldquo;Your Data&rdquo;). You grant RevLooper a
        limited, non-exclusive licence to process Your Data solely to provide the Service.
      </p>
      <p>
        You warrant that:
      </p>
      <ul>
        <li>You have a lawful basis to collect, store, and contact each individual in your lead lists</li>
        <li>Your Data does not infringe any third-party intellectual property rights</li>
        <li>Your Data does not contain illegal content</li>
      </ul>
      <p>
        RevLooper processes lead data on your behalf as a data processor under your
        instructions. Refer to our{" "}
        <a href="/privacy">Privacy Policy</a> and, for Enterprise customers, our Data
        Processing Agreement (DPA).
      </p>

      <h2>6. Subscriptions &amp; Billing</h2>

      <h3>6.1 Plans</h3>
      <p>
        RevLooper offers Free, Pro, Business, and Agency plans. Feature entitlements, usage
        limits, and pricing are as published on{" "}
        <a href="/#pricing">revlooper.com/#pricing</a> and may be updated from time to time
        with notice.
      </p>

      <h3>6.2 Payment</h3>
      <p>
        Paid plans are billed monthly or annually in advance. Payments are processed by
        Paddle (international) or payOS / MoMo / VNPay (Vietnam). By subscribing, you
        authorise RevLooper to charge your selected payment method on a recurring basis.
      </p>

      <h3>6.3 AI Credits</h3>
      <p>
        Certain AI operations consume credits included in your plan. Additional credits can
        be purchased at $5 per 500 credits. Unused credits do not roll over between billing
        periods unless otherwise stated.
      </p>

      <h3>6.4 Refunds</h3>
      <p>
        Monthly subscriptions are non-refundable. Annual subscriptions may receive a pro-rata
        refund within 14 days of the start of a new annual term if you contact us at{" "}
        <a href="mailto:billing@revlooper.com">billing@revlooper.com</a>. We reserve the
        right to decline refunds for accounts found to be in violation of these Terms.
      </p>

      <h3>6.5 Downgrades &amp; Cancellation</h3>
      <p>
        You may cancel or downgrade your plan at any time from account settings. Access
        continues until the end of the current billing period. Cancellation does not
        automatically delete your data — you must request deletion separately.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The RevLooper platform, brand, design, and underlying technology are owned by
        RevLooper Pte. Ltd. and protected by copyright, trademark, and other intellectual
        property laws. These Terms do not grant you any right to use RevLooper&rsquo;s name,
        logo, or trademarks without prior written consent.
      </p>
      <p>
        You retain all intellectual property rights in Your Data and in content you create
        using the Service, including AI-generated outputs that you have reviewed and adopted.
      </p>

      <h2>8. Third-Party Integrations</h2>
      <p>
        The Service integrates with third-party platforms (Gmail, Outlook, Apollo.io,
        Zalo, Facebook, Google Calendar, etc.). Your use of those integrations is also
        governed by those platforms&rsquo; own terms and policies. RevLooper is not responsible
        for third-party platform outages, policy changes, or data practices.
      </p>

      <h2>9. Service Availability &amp; SLA</h2>
      <p>
        We target 99.5% monthly uptime for paid plans, excluding scheduled maintenance
        (notified at least 48 hours in advance) and events beyond our reasonable control
        (force majeure). The Free plan is provided on a best-effort basis with no uptime
        guarantee.
      </p>
      <p>
        We may suspend the Service temporarily for maintenance, security, or legal reasons.
        We will provide notice where practicable.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
        KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. REVLOOPER DOES NOT WARRANT
        THAT THE SERVICE WILL BE ERROR-FREE, UNINTERRUPTED, OR FREE OF VIRUSES.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, REVLOOPER&rsquo;S TOTAL LIABILITY FOR ANY CLAIM
        ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO REVLOOPER IN THE
        THREE (3) MONTHS PRECEDING THE CLAIM. REVLOOPER SHALL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
        DATA, OR GOODWILL.
      </p>
      <p>
        Some jurisdictions do not allow limitation of liability — in those jurisdictions,
        RevLooper&rsquo;s liability is limited to the fullest extent permitted by law.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless RevLooper and its officers,
        directors, employees, and agents from any claim, damage, or expense (including
        reasonable legal fees) arising from: (a) your use of the Service; (b) Your Data;
        (c) your violation of these Terms; or (d) your violation of any applicable law
        or third-party rights.
      </p>

      <h2>13. Termination</h2>
      <p>
        Either party may terminate these Terms at any time. RevLooper may immediately
        terminate or suspend access for material breach of these Terms, including
        prohibited use under Section 3.2, non-payment, or legal requirements.
      </p>
      <p>
        Upon termination, your right to use the Service ceases immediately. We will
        retain your data for 90 days post-termination to allow you to export it, after
        which it will be deleted in accordance with our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>14. Governing Law &amp; Disputes</h2>
      <p>
        These Terms are governed by the laws of <strong>Singapore</strong>. Any dispute
        arising out of or in connection with these Terms shall first be referred to good-faith
        negotiation. If unresolved within 30 days, disputes shall be submitted to the
        exclusive jurisdiction of the courts of Singapore.
      </p>
      <p>
        For customers in Vietnam, mandatory consumer protection provisions under Vietnamese
        law shall apply where they conflict with these Terms.
      </p>

      <h2>15. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes
        via email or in-app notice at least 14 days before the new Terms take effect.
        Continued use of the Service after the effective date constitutes your acceptance
        of the updated Terms.
      </p>

      <h2>16. Contact</h2>
      <p>
        For questions about these Terms, contact us at:{" "}
        <a href="mailto:legal@revlooper.com">legal@revlooper.com</a>
      </p>
    </LegalLayout>
  );
}
