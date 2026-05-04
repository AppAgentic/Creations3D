import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
          Terms
        </p>
        <h1 className="mt-4 font-display text-5xl font-black leading-none">
          Terms of service
        </h1>
        <div className="mt-10 space-y-7 text-sm leading-7 text-white/62">
          <p>Last updated: April 29, 2026.</p>
          <p>
            Creations3D provides paid credits for generating 3D assets from
            text and image prompts. Credits are reserved when a generation job
            starts and are consumed when a usable result is returned.
          </p>
          <p>
            Users are responsible for prompts, uploaded references, and how
            generated assets are used. Do not upload content you do not have the
            right to use.
          </p>
          <p>
            Generation availability can depend on third-party services. Failed
            generation jobs should be refunded automatically when the server
            receives a generation error.
          </p>
          <p>
            Paid subscriptions and checkout are managed by Whop. Plan access,
            monthly credit amounts, and billing changes apply to the signed-in
            account used at checkout.
          </p>
          <p>
            Creations3D may limit or suspend access for abuse, attempts to
            bypass credit limits, unlawful content, or activity that harms the
            service. Contact support if you need help with billing, credits, or
            account deletion.
          </p>
        </div>
        <Link
          href="/pricing"
          className="mt-10 inline-flex border border-white/10 px-4 py-3 text-sm text-white/75 hover:text-white"
        >
          View paid plans
        </Link>
      </main>
    </div>
  );
}
