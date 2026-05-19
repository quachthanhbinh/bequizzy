import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — RevLooper",
  description:
    "Learn how RevLooper collects, uses, and protects your personal data in compliance with GDPR, PDPA (Thailand), and Vietnam's Decree 13/2023.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="May 5, 2026">
      <p>
        RevLooper (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{" "}
        <a href="https://revlooper.com">revlooper.com</a> and the RevLooper SaaS platform
        (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains what personal data
        we collect, why we collect it, how we use and protect it, and your rights as a data
        subject.
      </p>
      <p>
        By creating an account or using the Service, you agree to this Privacy Policy. If you
        do not agree, please do not use the Service.
      </p>

      <hr />

      <h2>1. Who We Are</h2>
      <p>
        RevLooper is an AI-native sales outreach platform for solo founders and small B2B
        teams, with a primary focus on Southeast Asia. The data controller for personal data
        processed through the Service is:
      </p>
      <p>
        <strong>RevLooper Pte. Ltd.</strong><br />
        Email: <a href="mailto:privacy@revlooper.com">privacy@revlooper.com</a>
      </p>

      <h2>2. Data We Collect</h2>

      <h3>2.1 Account &amp; Profile Data</h3>
      <ul>
        <li>Name, email address, and password (hashed — we never store plain-text passwords)</li>
        <li>Phone number (optional, used for SMS notifications)</li>
        <li>Company name, job title, and website (optional)</li>
        <li>OAuth profile data when you sign in with Google, Microsoft, or Facebook</li>
      </ul>

      <h3>2.2 Usage &amp; Product Data</h3>
      <ul>
        <li>Actions you take inside the platform (campaigns created, emails sent, meetings booked)</li>
        <li>Feature usage frequency and navigation patterns</li>
        <li>AI-generated content you create, edit, or delete (email drafts, sequences, AI Brain documents)</li>
        <li>Integration connection status (Gmail, Outlook, Zalo, etc.) — we store OAuth tokens securely, never your email password</li>
      </ul>

      <h3>2.3 Lead &amp; Contact Data You Upload</h3>
      <p>
        When you import leads into RevLooper (via CSV, lead forms, or connected integrations),
        you upload personal data belonging to third parties. You are the data controller for
        that data; RevLooper processes it on your behalf as a data processor. You warrant that
        you have a lawful basis to upload and contact those individuals.
      </p>

      <h3>2.4 Communications Data</h3>
      <ul>
        <li>Emails sent and received through connected mailboxes (read to display in Unified Inbox and to train reply suggestions)</li>
        <li>Reply content, open and click events from outreach emails</li>
        <li>Meeting booking details (name, email, selected time slots)</li>
      </ul>

      <h3>2.5 Technical &amp; Device Data</h3>
      <ul>
        <li>IP address, browser type, operating system</li>
        <li>Cloudflare request logs (retained for up to 30 days)</li>
        <li>Cookies and similar tracking technologies (see Section 8)</li>
      </ul>

      <h3>2.6 Billing Data</h3>
      <p>
        Payment card details are processed and stored exclusively by our payment processors
        (Paddle for international transactions; payOS / MoMo / VNPay for Vietnam). RevLooper
        stores only a billing reference ID and subscription status — never raw card numbers.
      </p>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li><strong>Providing the Service</strong> — running campaigns, sending outreach, booking meetings, delivering AI-generated content</li>
        <li><strong>Account management</strong> — authentication, workspace configuration, billing, notifications</li>
        <li><strong>AI personalisation</strong> — your AI Brain documents and past interactions are used to ground AI outputs in your specific business context. This data is scoped to your workspace and is not used to train shared models</li>
        <li><strong>Product improvement</strong> — aggregated, anonymised usage analytics to improve features</li>
        <li><strong>Security &amp; fraud prevention</strong> — detecting abuse, enforcing rate limits, auditing access</li>
        <li><strong>Legal compliance</strong> — meeting obligations under applicable laws</li>
        <li><strong>Marketing</strong> — with your consent, sending product updates and tips via email. You can unsubscribe at any time</li>
      </ul>

      <h2>4. Legal Bases for Processing (GDPR / PDPA)</h2>
      <ul>
        <li><strong>Contract performance</strong> — processing necessary to deliver the Service you subscribed to</li>
        <li><strong>Legitimate interests</strong> — product analytics, security monitoring, fraud prevention</li>
        <li><strong>Consent</strong> — marketing emails, optional cookies, processing of sensitive data where required</li>
        <li><strong>Legal obligation</strong> — retaining transaction records, responding to lawful requests</li>
      </ul>
      <p>
        For users in Vietnam, we comply with <strong>Decree 13/2023/ND-CP</strong> on personal
        data protection. For users in Thailand, we comply with the <strong>Personal Data Protection
        Act B.E. 2562 (PDPA)</strong>. For users in Singapore, we comply with the{" "}
        <strong>Personal Data Protection Act 2012 (PDPA SG)</strong>.
      </p>

      <h2>5. Data Sharing &amp; Sub-processors</h2>
      <p>
        We do not sell your personal data. We share data only with trusted sub-processors
        necessary to operate the Service:
      </p>
      <ul>
        <li><strong>Supabase</strong> — database and authentication (hosted in Singapore / EU)</li>
        <li><strong>Google Cloud Platform</strong> — compute, storage, and AI inference (asia-southeast1 region)</li>
        <li><strong>Cloudflare</strong> — CDN, DDoS protection, edge compute</li>
        <li><strong>OpenAI / Anthropic / Google DeepMind</strong> — AI inference for campaign generation and reply suggestions. Prompts may contain lead names and email context; we use API agreements that prohibit training on your data</li>
        <li><strong>Apollo.io / Hunter.io</strong> — lead enrichment (only invoked when you explicitly enrich a lead)</li>
        <li><strong>Mailreach</strong> — email warm-up service for connected mailboxes</li>
        <li><strong>Resend / Twilio / ESMS.vn</strong> — transactional email and SMS notifications</li>
        <li><strong>Paddle / payOS / MoMo / VNPay</strong> — payment processing</li>
        <li><strong>Novu</strong> — notification orchestration</li>
      </ul>
      <p>
        We maintain a full sub-processor list and notify customers of material changes at
        least 30 days in advance.
      </p>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Account data is retained for the life of your account plus 90 days after deletion</li>
        <li>Lead and campaign data is retained until you delete it or close your account</li>
        <li>Billing records are retained for 7 years to comply with tax regulations</li>
        <li>Security and access logs are retained for 12 months</li>
        <li>Anonymised, aggregated analytics data may be retained indefinitely</li>
      </ul>

      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
        <li><strong>Rectification</strong> — correct inaccurate or incomplete data</li>
        <li><strong>Erasure</strong> — request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
        <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
        <li><strong>Restriction</strong> — ask us to limit processing in certain circumstances</li>
        <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
        <li><strong>Withdraw consent</strong> — at any time for consent-based processing</li>
      </ul>
      <p>
        To exercise any right, email{" "}
        <a href="mailto:privacy@revlooper.com">privacy@revlooper.com</a>. We respond within
        30 days. You may also submit a complaint to your local data protection authority.
      </p>

      <h2>8. Cookies</h2>
      <p>We use the following categories of cookies:</p>
      <ul>
        <li><strong>Strictly necessary</strong> — authentication session tokens; cannot be disabled</li>
        <li><strong>Functional</strong> — language preference, UI settings</li>
        <li><strong>Analytics</strong> — anonymised page-view and feature-usage data (opt-out available in account settings)</li>
        <li><strong>Marketing</strong> — only with your explicit consent; used for retargeting on platforms such as Google and Facebook</li>
      </ul>

      <h2>9. Security</h2>
      <p>
        We protect your data with: TLS 1.3 in transit; AES-256 encryption at rest;
        row-level security (RLS) enforced at the database layer; secrets stored in GCP
        Secret Manager; multi-factor authentication available on all accounts; and regular
        third-party security audits.
      </p>
      <p>
        In the event of a personal data breach that poses a risk to your rights, we will
        notify you and relevant regulators within 72 hours of becoming aware.
      </p>

      <h2>10. International Transfers</h2>
      <p>
        Data is primarily processed in the <strong>asia-southeast1 (Singapore)</strong> GCP
        region. Some AI inference requests may be processed by OpenAI (US) or Anthropic (US)
        under Standard Contractual Clauses. We do not transfer data to countries without
        adequate protection without implementing appropriate safeguards.
      </p>

      <h2>11. Children&rsquo;s Privacy</h2>
      <p>
        The Service is intended for business use by individuals aged 18 and over. We do not
        knowingly collect personal data from children under 13. If you believe a child has
        provided us data, contact us immediately at{" "}
        <a href="mailto:privacy@revlooper.com">privacy@revlooper.com</a>.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. We will notify you of material changes
        via email or an in-app notice at least 14 days before they take effect. Continued
        use of the Service after the effective date constitutes acceptance.
      </p>

      <h2>13. Contact</h2>
      <p>
        For privacy-related questions or requests, contact our Data Protection Officer at:{" "}
        <a href="mailto:privacy@revlooper.com">privacy@revlooper.com</a>
      </p>
    </LegalLayout>
  );
}
