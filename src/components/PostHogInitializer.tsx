"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

const posthogApiKey =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export default function PostHogInitializer() {
  const { isLoaded, isSignedIn, user } = useUser();
  const wasSignedInRef = useRef(false);

  useEffect(() => {
    if (!posthogApiKey) {
      console.warn("NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_API_KEY is not set. PostHog will not initialize.");
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

  useEffect(() => {
    if (!isLoaded || !posthogApiKey) {
      return;
    }

    if (isSignedIn && user?.id) {
      posthog.identify(user.id, {
        name: user.fullName || user.username || user.id,
        login_id: user.id,
        username: user.username || null,
        is_logged_in: true,
      });
      wasSignedInRef.current = true;
      return;
    }

    if (wasSignedInRef.current && isSignedIn === false) {
      posthog.reset();
      wasSignedInRef.current = false;
    }
  }, [isLoaded, isSignedIn, user?.id, user?.fullName, user?.username]);

  return null;
}
