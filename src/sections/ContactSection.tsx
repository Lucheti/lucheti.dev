import type { ReactNode } from "react";
import type { Contact } from "@/content";
import { Chapter } from "@/story";

type ContactSectionProps = Readonly<{
  contact: Contact;
  timeZone: string;
  city: string;
}>;

/** Placeholder until WP-H lands. */
export function ContactSection({ contact }: ContactSectionProps): ReactNode {
  return (
    <Chapter id="contact" className="min-h-dvh p-16">
      <h2 className="font-display text-6xl font-semibold">{contact.heading}</h2>
    </Chapter>
  );
}
