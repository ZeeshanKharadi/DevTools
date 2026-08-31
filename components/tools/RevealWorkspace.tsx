"use client";

import { useEffect } from "react";

export function RevealWorkspace() {
  useEffect(() => {
    const workspace = document.getElementById("workspace");

    if (!workspace) {
      return;
    }

    const header = document.querySelector("header");
    const headerHeight = header?.getBoundingClientRect().height ?? 64;
    const top =
      window.scrollY + workspace.getBoundingClientRect().top - headerHeight - 16;

    if (workspace.getBoundingClientRect().top > window.innerHeight * 0.4) {
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    }
  }, []);

  return null;
}
