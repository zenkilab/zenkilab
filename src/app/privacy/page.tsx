import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-28 lg:px-8">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Privacy Policy</h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Introduction">
          <p>
            Zenki Lab respects your privacy. This policy describes how we handle information across the Zenki Lab
            website and related services, including our public quotation site and the internal Zenki Hub system used
            by approved staff.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>Information you provide to us, such as when you request a quote or place an order:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Quotation, order, or project details</li>
            <li>Uploaded files or project information, where applicable</li>
          </ul>
          <p>Basic technical information generated when you use our website:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>IP address</li>
            <li>Browser and device information</li>
            <li>Security and access logs</li>
          </ul>
        </Section>

        <Section title="3. Google Sign-In / Staff Authentication">
          <p>
            Approved Zenki Lab staff may authenticate with our internal systems using Google Sign-In. This process
            provides us basic identity information: your email address, name, and basic profile information.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Google Sign-In is used only for authentication and account identification.</li>
            <li>
              Zenki Lab does not request or access Gmail messages, Google Drive files, contacts, calendars, or any
              other unrelated Google account data.
            </li>
            <li>Access to internal Zenki Lab systems is limited to pre-approved staff accounts.</li>
            <li>Signing in with Google never gives Zenki Lab access to your Google password.</li>
          </ul>
          <p>The Google sign-in scopes used are limited to: <span className="font-mono text-xs">openid</span>, <span className="font-mono text-xs">email</span>, <span className="font-mono text-xs">profile</span>.</p>
        </Section>

        <Section title="4. How We Use Information">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Providing quotations and services</li>
            <li>Processing customer requests</li>
            <li>Communicating with customers</li>
            <li>Operating Zenki Lab business systems</li>
            <li>Authenticating authorized staff</li>
            <li>Maintaining security and preventing abuse</li>
            <li>Maintaining business and accounting records where legitimately required</li>
          </ul>
        </Section>

        <Section title="5. Sharing of Information">
          <p>
            Zenki Lab does not sell personal information. Information may be processed by service providers needed
            to operate our services, including Google for authentication, Cloudflare for security and access
            protection, and our hosting and infrastructure providers.
          </p>
        </Section>

        <Section title="6. Data Security">
          <p>
            We use reasonable technical and organizational safeguards to protect information, including restricted
            staff access, authentication controls, and secure infrastructure. No system can be guaranteed
            completely secure, but we work to protect information appropriately.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain information only as long as reasonably necessary for service delivery, business records,
            accounting or legal obligations, and security purposes.
          </p>
        </Section>

        <Section title="8. User Choices / Requests">
          <p>
            To ask about the information we hold about you, or to request correction or deletion where applicable,
            contact us at{" "}
            <a href="mailto:zenkilabhq@gmail.com" className="text-primary underline underline-offset-2 hover:text-[color:var(--color-accent-primary-light)]">
              zenkilabhq@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>
            Third-party services we use, such as Google and Cloudflare, operate under their own privacy policies,
            which govern how they handle information on their platforms.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page
            reflects the most recent changes.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>Zenki Lab</p>
          <p>
            Email:{" "}
            <a href="mailto:zenkilabhq@gmail.com" className="text-primary underline underline-offset-2 hover:text-[color:var(--color-accent-primary-light)]">
              zenkilabhq@gmail.com
            </a>
          </p>
          <p>
            Website:{" "}
            <a href="https://zenkilab.com" className="text-primary underline underline-offset-2 hover:text-[color:var(--color-accent-primary-light)]">
              https://zenkilab.com
            </a>
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
