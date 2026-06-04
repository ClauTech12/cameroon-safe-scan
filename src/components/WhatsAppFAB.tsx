import { MessageCircle } from "lucide-react";

interface Props {
  /** Phone in international format without +, e.g. "237699999999". Leave empty to open share dialog. */
  phone?: string;
  message?: string;
}

export function WhatsAppFAB({ phone = "+237650556715", message }: Props) {
  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://cameroon-safe-scan.lovable.app";
  const text =
    message ??
    `Hello CamAlert 👋 — I'd like to report or check a suspicious number. App: ${appUrl}`;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[60] h-14 w-14 rounded-full grid place-items-center shadow-lg shadow-black/20 hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200 ring-4 ring-white/20"
      style={{ background: "#25D366", color: "#fff" }}
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={0} />
      <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: "#25D366" }} />
    </a>
  );
}
