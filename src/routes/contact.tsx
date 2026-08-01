import { createFileRoute } from "@tanstack/react-router";
import { AboutAndContactPage } from "./about";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & About — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Reach the DIGITs team: partnerships for CSOs and newsrooms, observer support, platform issues, and general inquiries.",
      },
      { property: "og:title", content: "Contact DIGITs Election Watch" },
    ],
  }),
  component: AboutAndContactPage,
});
