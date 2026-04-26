import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function SupportPage() {
  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
          Support
        </p>
        <h1 className="mt-4 font-display text-5xl font-black leading-none">
          Support
        </h1>
        <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {[
            ["Billing", "Subscription, credit balance, or Whop checkout help."],
            ["Generation", "Failed jobs, exports, model quality, and provider errors."],
            ["Account", "Firebase login, saved models, and data deletion requests."],
            ["Studios", "Team usage, higher credit volume, and custom workflows."],
          ].map(([title, body]) => (
            <div key={title} className="bg-[#0c0f0c] p-5">
              <h2 className="font-display text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm leading-7 text-white/62">
          Add the production support email or helpdesk link here before launch.
        </p>
        <Link
          href="/generate"
          className="mt-8 inline-flex border border-white/10 px-4 py-3 text-sm text-white/75 hover:text-white"
        >
          Back to generator
        </Link>
      </main>
    </div>
  );
}
