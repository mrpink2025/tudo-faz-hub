import { useEffect } from "react";

// Subtle pointer-follow glow overlay
const SignatureGlow = () => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--pointer-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage:
          "radial-gradient(600px_circle_at_var(--pointer-x)_var(--pointer-y), hsl(var(--brand)/0.12), transparent 70%)",
      }}
    />
  );
};

export default SignatureGlow;
