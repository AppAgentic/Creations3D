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
          Get help with your account or models.
        </h1>
        <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {[
            ["Billing", "Subscription, credit balance, or checkout help."],
            [
              "Generation",
              "Failed jobs, exports, and model quality questions.",
            ],
            ["Account", "Login, saved models, and data deletion requests."],
            [
              "Studios",
              "Team usage, higher credit volume, and custom workflows.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="bg-[#0c0f0c] p-5">
              <h2 className="font-display text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 border border-white/10 bg-white/[0.03] p-5">
          <p className="font-display text-2xl font-black">Contact support</p>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Email{" "}
            <a
              className="text-primary hover:text-primary/80"
              href="mailto:support@creations3d.com"
            >
              support@creations3d.com
            </a>{" "}
            with your account email, the prompt or image you used, and what you
            expected to happen. We aim to reply within 1 business day.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/62">
            If a generation fails after credits are reserved, the app should
            refund those credits automatically. Include the generation time if
            you want us to check it.
          </p>
        </div>
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
