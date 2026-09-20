"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { contactChannels } from "@/lib/constants";
import { ScrollFade } from "@/components/ui/scroll-fade";

/* ── Official platform SVG icons (20px, var(--color-accent-primary) fill) ── */

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982 1.005-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
        fill="var(--color-accent-warm)"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"
        stroke="var(--color-accent-warm)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="m22 6-10 7L2 6"
        stroke="var(--color-accent-warm)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="var(--color-accent-warm)" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="5" stroke="var(--color-accent-warm)" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="var(--color-accent-warm)" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z"
        stroke="var(--color-accent-warm)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.072 0H13.08v16.348c0 1.546-1.263 2.8-2.82 2.8a2.807 2.807 0 0 1-2.819-2.8c0-1.547 1.263-2.8 2.82-2.8.294 0 .58.046.854.132V9.446A6.745 6.745 0 0 0 10.26 9.2c-3.73 0-6.76 3.003-6.76 6.696 0 3.693 3.03 6.696 6.76 6.696 3.731 0 6.76-3.003 6.76-6.696V7.982A8.823 8.823 0 0 0 22 9.624V5.664C19.296 5.664 17.072 3.136 17.072 0Z"
        fill="var(--color-accent-warm)"
        transform="translate(1 2) scale(0.88)"
      />
    </svg>
  );
}

const channelIcons: Record<string, React.ReactNode> = {
  WhatsApp: <WhatsAppIcon />,
  Email: <EmailIcon />,
  Instagram: <InstagramIcon />,
  Facebook: <FacebookIcon />,
  TikTok: <TikTokIcon />,
};

// One primary route (WhatsApp) and the rest as quiet links, so there is a single clear action.
export function ContactSection() {
  const [primary, ...others] = contactChannels;
  return (
    <section id="contact" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <ScrollFade>
            <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[600px]" style={{ color: "var(--color-text-primary)" }}>
            Let&apos;s make something together.
          </h2>
          </ScrollFade>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <a
              href={primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-20 items-center gap-4 rounded-2xl p-5 transition-colors duration-300 hover:border-primary motion-reduce:transition-none"
              style={{ border: "1px solid color-mix(in srgb, var(--color-accent-primary) 45%, transparent)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
              >
                {channelIcons[primary.label] ?? <WhatsAppIcon />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{primary.label}</span>
                <span className="block truncate font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>{primary.value}</span>
              </span>
              <ExternalLink
                className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                style={{ color: "var(--color-accent-primary)" }}
                aria-hidden="true"
              />
            </a>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {others.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-white/5 motion-reduce:transition-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">{channelIcons[channel.label]}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{channel.label}</span>
                      <span className="block truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>{channel.value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
