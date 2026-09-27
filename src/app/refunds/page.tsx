import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalLink } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy | Zenki Lab",
  description: "How Zenki Lab handles cancellations, refunds, and problems with custom 3D printed orders.",
  alternates: {
    canonical: "https://zenkilab.com/refunds",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "September 25, 2026";

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Overview">
        <p>
          Most Zenki Lab products are custom or made-to-order: printed from a design file you provide, or, for
          products like the Chibi Figure, from a 3D model generated for you and approved by you before printing.
          Because of this, our approach to refunds is different from a standard ready-made retail product. If we
          offer ready-made, in-stock products in the future, we will describe how this policy applies to those
          separately.
        </p>
      </LegalSection>

      <LegalSection title="2. Quote Requests Are Not Orders">
        <p>
          Submitting a quote request, whether through our website, the key tag configurator, or WhatsApp, does not
          create a binding order and nothing is charged. This policy applies once you have confirmed an order or
          arranged a deposit with us.
        </p>
      </LegalSection>

      <LegalSection title="3. Cancelling Before Production Starts">
        <p>
          If you cancel before we have started producing your order, we will refund any deposit in full, unless we
          have already carried out design or model work at your request, for example generating a Chibi Figure 3D
          model. Once that work has been done, the deposit is not refundable, since it covers the cost of that work.
          If you decide not to proceed after reviewing a generated model, contact us before we begin printing.
        </p>
      </LegalSection>

      <LegalSection title="4. No Refunds Once Printing Has Started">
        <p>
          Once we have started printing your order, we are unable to offer a refund for cancellation. Each item is
          manufactured specifically for you from the specifications you approved, and materials and machine time are
          committed as soon as printing begins. This does not affect your rights if the item arrives defective,
          damaged, or materially different from what you approved. See sections 5 and 6.
        </p>
      </LegalSection>

      <LegalSection title="5. Defective, Damaged, or Incorrect Items">
        <p>
          If your order arrives damaged or defective, or is not what you ordered, please contact us within 3 days of
          delivery with your order details and photos of the issue so we can look into it. Depending on the
          situation, we will offer a reprint, repair, or refund.
        </p>
      </LegalSection>

      <LegalSection title="6. Items That Differ Materially From What You Approved">
        <p>
          For products with a preview or model approval step, we aim to produce your order to match what you
          approved. If the finished item is materially different from the approved design, text, colours, or
          specification through an error on our part, contact us and we will make it right, for example by
          correcting and reprinting the item or offering a refund.
        </p>
      </LegalSection>

      <LegalSection title="7. How to Report a Problem">
        <p>
          Contact us at <LegalLink href="mailto:zenkilabhq@gmail.com">zenkilabhq@gmail.com</LegalLink> or through
          WhatsApp within 3 days of delivery, with your order details, such as your order ID if you have one, what
          you ordered, and photos where relevant, and we will get back to you.
        </p>
      </LegalSection>

      <LegalSection title="8. Remedies">
        <p>
          Depending on the situation, we may offer a reprint, repair, partial refund, or full refund. We aim to
          resolve issues fairly and will discuss the right outcome with you based on your specific order. Once a
          refund is approved, we will process it within 7 business days.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Statutory Rights">
        <p>
          Nothing in this Refund Policy limits any right you have under applicable Sri Lankan consumer protection
          law that cannot lawfully be excluded or limited.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>
          We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page
          reflects the most recent changes.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
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
