"use client";

import { Countdown } from "@/components/app/Countdown";

export function CountdownWrapper({ target }: { target: string }) {
  return <Countdown target={target} />;
}
