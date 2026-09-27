import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalLink } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Zenki Lab",
  description:
    "Learn how Zenki Lab handles personal information, customer data, and Google authentication information.",
  alternates: {
    canonical: "https://zenkilab.com/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "September 25, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Introduction">
        <p>
          Zenki Lab (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This policy explains
          how we handle information across the Zenki Lab website (zenkilab.com), our online store, our custom key
          tag configurator, and our quote request forms. It also explains how Google Sign-In is used by our staff.
          It applies to visitors and customers of our public website, not to the restricted internal system
          (&quot;Zenki Hub&quot;) that our staff use to manage requests and quotes, which is not a public feature.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>Information you provide to us:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Name, email address, and phone or WhatsApp number</li>
          <li>Project details submitted through a quote request or the key tag configurator, such as material, colour, quantity, layer height, desired completion date, and notes</li>
          <li>Design files you upload when requesting a quote (for example STL, OBJ, 3MF, STEP, or ZIP files)</li>
          <li>Text and style choices entered into the key tag configurator</li>
          <li>Messages, reference photos, or files you choose to send us directly, such as by WhatsApp or email (for example, reference photos for a Chibi Figure)</li>
        </ul>
        <p>Basic technical information generated when you use our website:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>IP address</li>
          <li>Browser and device information</li>
          <li>General usage information collected through analytics (see Cookies and Analytics below)</li>
          <li>Security and access logs on our hosting and email infrastructure</li>
        </ul>
        <p>
          We do not currently operate customer accounts or a login system on the public website. Details you enter
          into the key tag configurator are held temporarily in your browser so you can review your quote, and are
          cleared when your browser session ends or your quote expires.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies and Analytics">
        <p>
          We use Google Analytics to understand how visitors use our website, so we can improve it. Google Analytics
          uses cookies and similar technologies and may collect information such as your IP address, device and
          browser type, and the pages you view. We do not use this information to identify you personally, and we
          do not use advertising or retargeting cookies. You can control or block cookies through your browser
          settings, which may affect how some parts of the site work.
        </p>
      </LegalSection>

      <LegalSection title="4. Google Sign-In and Staff Access (Zenki Hub)">
        <p>
          Zenki Hub is a restricted internal system used only by approved Zenki Lab staff to manage quote requests,
          orders, and customer communications. It is not a public customer account system, and customers do not
          sign in to Zenki Hub.
        </p>
        <p>
          Approved staff may authenticate to Zenki Hub using Google Sign-In. This provides us basic identity
          information about that staff member: their email address, name, and basic profile information.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Google Sign-In is used only for staff authentication and account identification.</li>
          <li>
            Zenki Lab does not request or access Gmail messages, Google Drive files, contacts, calendars, or any
            other unrelated Google account data.
          </li>
          <li>Access to Zenki Hub is limited to pre-approved staff Google accounts.</li>
          <li>Signing in with Google never gives Zenki Lab access to a staff member&apos;s Google password.</li>
        </ul>
        <p>
          The Google sign-in scopes used are limited to: <span className="font-mono text-xs">openid</span>,{" "}
          <span className="font-mono text-xs">email</span>, <span className="font-mono text-xs">profile</span>.
        </p>
      </LegalSection>

      <LegalSection title="5. How We Use Information">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Preparing and sending quotations</li>
          <li>Processing and producing your order once confirmed</li>
          <li>Communicating with you about your request, quote, or order</li>
          <li>Operating our store and the key tag configurator</li>
          <li>Generating 3D models for specific products, such as using Meshy AI for the Chibi Figure, when you provide reference photos for that purpose</li>
          <li>Authenticating authorized staff and operating Zenki Hub</li>
          <li>Maintaining the security of our website and systems, and preventing abuse</li>
          <li>Understanding and improving how our website is used</li>
          <li>Maintaining business and accounting records where legitimately required</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Sharing of Information">
        <p>
          We do not sell personal information. We share information only with service providers that help us run
          our website and business, including:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Google, for staff authentication (Google Sign-In) and website analytics (Google Analytics)</li>
          <li>Resend, our email delivery provider, to send quote and order details and file attachments to our team, and confirmation emails to you</li>
          <li>Cloudflare, for hosting and security and access protection</li>
          <li>Meshy AI, for generating 3D models from reference photos you provide for products such as the Chibi Figure</li>
          <li>WhatsApp (Meta), when you choose to contact us or complete a step of an order over WhatsApp</li>
        </ul>
        <p>
          These providers process information on our behalf and are only given what they need to provide their
          service. Some of them may process information outside Sri Lanka. We may also disclose information if
          required by law.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>
          We use reasonable technical and organizational safeguards to protect information, including restricted
          staff access, authentication controls, and secure infrastructure. No system can be guaranteed completely
          secure, but we work to protect information appropriately.
        </p>
      </LegalSection>

      <LegalSection title="8. Data Retention">
        <p>
          We keep information only as long as reasonably necessary for the purpose it was collected, for example to
          deliver a quote or order, to keep business and accounting records, or to meet legal obligations. Retention
          depends on the type of information and why we hold it.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Choices and Requests">
        <p>
          To ask about the information we hold about you, or to request correction or deletion where applicable,
          contact us at <LegalLink href="mailto:zenkilabhq@gmail.com">zenkilabhq@gmail.com</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="10. Third-Party Services">
        <p>
          Third-party services we use or link to, including Google, Cloudflare, Resend, Meshy AI, WhatsApp,
          Instagram, Facebook, and TikTok, operate under their own privacy policies, which govern how they handle
          information on their platforms. We encourage you to review those policies if you use those services.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to This Policy">
        <p>
          We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page
          reflects the most recent changes.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Zenki Lab</p>
        <p>
          Email: <LegalLink href="mailto:zenkilabhq@gmail.com">zenkilabhq@gmail.com</LegalLink>
        </p>
        <p>
          Website: <LegalLink href="https://zenkilab.com">https://zenkilab.com</LegalLink>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
