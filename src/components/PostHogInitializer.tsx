"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export default function PostHogInitializer() {
  useEffect(() => {
    if (!posthogApiKey) {
      console.warn("NEXT_PUBLIC_POSTHOG_API_KEY is not set. PostHog will not initialize.");
      return;
    }

    posthog.init(posthogApiKey, {
      api_host: posthogHost,
      autocapture: true,
      capture_pageview: true,
      persistence: "localStorage",
      loaded: (ph) => {
        if (ph?.__loaded) {
          return;
        }
      },
    });
  }, []);

  return null;
}
