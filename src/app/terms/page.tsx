import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalLink } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Zenki Lab",
  description: "The terms that apply when you request a quote, place an order, or use Zenki Lab's website and services.",
  alternates: {
    canonical: "https://zenkilab.com/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "September 25, 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Introduction">
        <p>
          These Terms of Service (&quot;Terms&quot;) apply when you use the Zenki Lab website (zenkilab.com), request
          a quote, or place an order for a custom 3D printed part, key tag, Chibi Figure, or other product or
          service we offer. By submitting a quote request or confirming an order, you agree to these Terms. If you
          do not agree, please do not use our quote or ordering features.
        </p>
      </LegalSection>

      <LegalSection title="2. About Zenki Lab">
        <p>
          Zenki Lab is a custom 3D printing workshop based in Sri Lanka. We manufacture parts, prototypes, and
          products from files you provide, or, for specific products such as the Chibi Figure, from a 3D model we
          generate for you that you approve before printing. We do not currently offer general CAD design, reverse
          engineering, or 3D modelling as a standalone service. Where a specific product includes model creation
          (for example, the Chibi Figure), that is described for that product.
        </p>
      </LegalSection>

      <LegalSection title="3. Quote Requests and Confirmed Orders">
        <p>
          A quote request is not a confirmed order. Submitting a quote request through our website, WhatsApp, or any
          other channel does not commit either of us to proceed.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-medium text-foreground">General project quotes.</span> When you submit a quote
            request with your design files and project details, we review it and respond, typically within 24
            hours, with a quote. This does not create an order; an order exists only once we have agreed to
            proceed.
          </li>
          <li>
            <span className="font-medium text-foreground">Key tag configurator.</span> Our online configurator
            produces a quote for the design you create, valid for a limited time shown on that page (currently 24
            hours). Selecting &quot;Confirm&quot; adds your design to our print queue for review. This does not
            take payment and is not a final sale; we may still contact you to confirm details before production
            begins.
          </li>
          <li>
            <span className="font-medium text-foreground">Chibi Figure and similar products.</span> For products
            that involve a deposit, your order begins once you have arranged the deposit with us directly (for
            example over WhatsApp) and after you have approved the generated 3D model. Nothing is printed before you
            approve the model.
          </li>
        </ul>
        <p>
          We may decline, or ask you to adjust, a request we are unable to produce as specified, for example due to
          printability, material, or capacity limitations.
        </p>
      </LegalSection>

      <LegalSection title="4. Your Design Files and Intellectual Property">
        <p>
          You keep ownership of any design files, text, or other content you submit to us. By submitting a file or
          content, you confirm that you have the right to do so and that it does not infringe anyone else&apos;s
          intellectual property or other rights, and you grant Zenki Lab a licence to use it solely to prepare your
          quote and produce your order.
        </p>
        <p>
          For products where we generate a 3D model on your behalf, such as the Chibi Figure, generated with Meshy
          AI from your reference photos, you confirm you have the right to share those photos with us for that
          purpose. Reference photos and generated models are used only to produce your order unless we agree
          otherwise with you.
        </p>
      </LegalSection>

      <LegalSection title="5. Checking and Approving Your Specifications">
        <p>
          You are responsible for checking that the text, dimensions, files, colours, and other specifications you
          submit or approve are correct. For products with a preview or model approval step, such as the key tag
          configurator or the Chibi Figure, we produce your order based on what you have approved. Please review
          previews and generated models carefully, since production begins based on what was approved.
        </p>
      </LegalSection>

      <LegalSection title="6. Payment">
        <p>
          Zenki Lab does not currently process payments on this website; there is no online checkout. Depending on
          the product, payment is arranged directly with our team, for example by WhatsApp, on delivery, or as a
          deposit and balance for specific products such as the Chibi Figure. Prices shown on our website and in
          quotes are in Sri Lankan Rupees (LKR) unless stated otherwise, and are estimates until confirmed by us.
        </p>
      </LegalSection>

      <LegalSection title="7. Production and Estimated Lead Times">
        <p>
          Production time depends on the size, complexity, and material of your order. Any timeline we give you,
          including examples shown on our website, is an estimate and not a guaranteed delivery date. We will let
          you know if we expect a delay.
        </p>
      </LegalSection>

      <LegalSection title="8. Delivery">
        <p>
          We currently offer island-wide delivery within Sri Lanka and pickup from our Colombo facility. Delivery or
          shipping to other locations may be possible for select orders on request; please ask us before assuming
          this is available for your order.
        </p>
      </LegalSection>

      <LegalSection title="9. Nature of 3D Printed Parts, Fit, Heat, Load and Safety">
        <p>
          3D printed parts have different properties from parts made by other manufacturing methods. Material
          properties, such as strength or heat resistance, shown on our website are general guidance, not a
          guarantee for your specific application.
        </p>
        <p>
          You are responsible for confirming that a part is fit for your intended use, including its fit, expected
          load, heat exposure, and any safety requirements, before relying on it, especially for automotive,
          structural, or other safety-critical applications. If your application is safety-critical, please tell us
          before ordering so we can discuss whether the part and material we propose are appropriate; we may decline
          orders we do not believe are suitable for the stated use. Nothing in this section limits any right you
          have under applicable Sri Lankan consumer protection law that cannot lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection title="10. Cancellations and Refunds">
        <p>
          Cancellations, refunds, and how we handle defective, damaged, or incorrect items are covered in our{" "}
          <LegalLink href="/refunds">Refund Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="11. Acceptable Use">
        <p>
          You agree not to submit files, text, or content that is illegal, infringes someone else&apos;s rights, or
          that you do not have permission to submit. We may decline to produce an order that we reasonably believe
          falls into this category.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of Liability">
        <p>
          To the extent permitted by law, Zenki Lab&apos;s liability for any issue with a quote, order, or our
          website is limited to the remedies described in our Refund Policy or to the amount you paid for the
          affected order. This does not limit any liability that cannot lawfully be limited or excluded under Sri
          Lankan law, including for matters such as death or personal injury caused by our negligence.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. The &quot;Last updated&quot; date at the top of this page
          reflects the most recent changes. Continuing to use our website or place orders after changes take effect
          means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Governing Law">
        <p>These Terms are governed by the laws of Sri Lanka.</p>
      </LegalSection>

      <LegalSection title="15. Contact">
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
