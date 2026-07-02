import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Role = "user" | "assistant";
interface ChatMsg {
  id: string;
  role: Role;
  content: string;
}
type Lang = "en" | "fr" | "pcm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/chat-assistant`;

function resolveLang(code: string | undefined): Lang {
  if (code?.startsWith("fr")) return "fr";
  if (code?.startsWith("pcm")) return "pcm";
  return "en";
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface QuickAction {
  labelKey: string;
  promptKey: string;
  to?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: "assistant.quick.report", promptKey: "assistant.prompts.report", to: "/report" },
  { labelKey: "assistant.quick.check", promptKey: "assistant.prompts.check", to: "/check" },
  { labelKey: "assistant.quick.analyzer", promptKey: "assistant.prompts.analyzer", to: "/analyzer" },
  { labelKey: "assistant.quick.momo", promptKey: "assistant.prompts.momo", to: "/momo-guard" },
  { labelKey: "assistant.quick.tips", promptKey: "assistant.prompts.tips" },
];

export function FloatingAssistant() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = resolveLang(i18n.language);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const welcome = useMemo(() => t("assistant.welcome"), [t, lang]);

  // Reset stream on language change so replies match the new language.
  useEffect(() => {
    if (streaming && abortRef.current) {
      abortRef.current.abort();
      setStreaming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || streaming) return;
    setError(null);

    const userMsg: ChatMsg = { id: newId(), role: "user", content: clean };
    const assistantId = newId();
    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          language: lang,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const code = resp.status === 429 ? "assistant.error.rate" : "assistant.error.generic";
        setError(t(code));
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              acc += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
              );
            }
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setError(t("assistant.error.generic"));
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleQuick = (action: QuickAction) => {
    if (action.to) {
      navigate(action.to);
      setOpen(false);
      return;
    }
    void send(t(action.promptKey));
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        aria-label={t("assistant.open")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-40 bottom-5 right-5 sm:bottom-6 sm:right-24 h-14 w-14 rounded-full",
          "bg-accent text-accent-foreground shadow-lg shadow-accent/30",
          "flex items-center justify-center transition-smooth hover:scale-[1.04] active:scale-95",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t("assistant.title")}
          className={cn(
            "fixed z-40 bottom-24 right-3 sm:right-24",
            "w-[calc(100vw-1.5rem)] max-w-sm h-[70vh] max-h-[560px]",
            "flex flex-col rounded-2xl border border-border bg-card shadow-2xl",
            "overflow-hidden animate-fade-in",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-accent/10 via-transparent to-transparent">
            <div className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">{t("assistant.title")}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {t("assistant.subtitle")}
              </div>
            </div>
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-sm text-foreground/90 leading-relaxed">
                {welcome}
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm",
                  )}
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-a:text-accent break-words">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="text-xs text-destructive px-1">{error}</div>
            )}
          </div>

          {/* Quick actions */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.labelKey}
                  type="button"
                  onClick={() => handleQuick(a)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-secondary transition-smooth"
                >
                  {t(a.labelKey)}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-border p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("assistant.placeholder")}
                disabled={streaming}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-input bg-background",
                  "px-3 py-2 text-sm max-h-32 focus-visible:outline-none",
                  "focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15",
                  "disabled:opacity-60",
                )}
              />
              <Button
                type="button"
                size="icon"
                aria-label={t("assistant.send")}
                onClick={() => void send(input)}
                disabled={streaming || !input.trim()}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-1.5 text-[10px] text-muted-foreground text-center">
              {t("assistant.footer")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
