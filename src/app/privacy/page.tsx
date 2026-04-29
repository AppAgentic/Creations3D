import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
          Privacy
        </p>
        <h1 className="mt-4 font-display text-5xl font-black leading-none">
          Privacy policy
        </h1>
        <div className="mt-10 space-y-7 text-sm leading-7 text-white/62">
          <p>Last updated: April 29, 2026.</p>
          <p>
            Creations3D uses account, payment, prompt, upload, and generation
            data to provide the product, manage credits, process subscriptions,
            and store model history for the signed-in account.
          </p>
          <p>
            Generated model files may be stored in Cloudflare R2. Authentication
            is handled by Firebase, payments by Whop, object generation by
            Replicate, and world generation by World Labs.
          </p>
          <p>
            We do not sell customer generation prompts or account data. Users
            can contact support to request account or data deletion.
          </p>
          <p>
            We keep service records needed for billing, security, credit
            accounting, and support. If you ask us to delete your account, we
            will remove or anonymize stored product data unless we need to keep
            limited records for legal, billing, or fraud-prevention reasons.
          </p>
        </div>
        <Link
          href="/support"
          className="mt-10 inline-flex border border-white/10 px-4 py-3 text-sm text-white/75 hover:text-white"
        >
          Contact support
        </Link>
      </main>
    </div>
  );
}
