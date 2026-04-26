"use client";

import Link from "next/link";
import type { ComponentProps, MouseEventHandler } from "react";
import { AnalyticsPayload, trackEvent } from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  eventPayload?: AnalyticsPayload;
};

export function TrackedLink({
  eventName,
  eventPayload,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackEvent(eventName, eventPayload);
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}
