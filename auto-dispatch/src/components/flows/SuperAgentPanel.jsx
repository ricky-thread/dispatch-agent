import { useEffect, useRef, useState } from "react";

const PANEL_ICONS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const SparkleSmall = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...PANEL_ICONS}>
    <path d="M12 3 L13.2 8.8 L19 10 L13.2 11.2 L12 17 L10.8 11.2 L5 10 L10.8 8.8 Z" />
    <path d="M19 17 L19.6 19.4 L22 20 L19.6 20.6 L19 23 L18.4 20.6 L16 20 L18.4 19.4 Z" />
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...PANEL_ICONS}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

const SendIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...PANEL_ICONS}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

// Static suggestion chips from the reference. These are intentionally not
// wired up to anything yet — they only seed the textarea so the user can
// see how the full chat-driven editing flow would feel.
const SUGGESTIONS = [
  "Send these to #vip-support",
  "Also filter for high priority",
  "Use Auto Categorize instead",
  "Send the note to the channel",
];

/**
 * Right-side "Super Magic" chat panel that renders next to the AI-built flow.
 *
 * Conversation state is local to the panel for now — real generation/persistence
 * would replace `setMessages` with an API call. The first time the panel mounts
 * we seed it with the user's prompt + the agent's greeting.
 */
export default function SuperAgentPanel({ initialPrompt = "" }) {
  const [messages, setMessages] = useState(() =>
    initialPrompt
      ? [
          { id: "user-0", role: "user", text: initialPrompt },
          {
            id: "agent-0",
            role: "agent",
            text:
              "Hi! I'm Super Magic — your draft flow is ready on the left. " +
              "Tell me what to change and I'll update it for you.",
          },
        ]
      : []
  );
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(null);

  // Keep the latest message in view whenever a new one is appended.
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { id: `user-${m.length}`, role: "user", text },
      {
        id: `agent-${m.length + 1}`,
        role: "agent",
        text: "Got it — I'll update the flow on the left.",
      },
    ]);
    setDraft("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <aside className="super-panel" aria-label="Super Magic assistant">
      <div className="super-header">
        <span className="super-avatar" aria-hidden="true">
          <SparkleSmall />
        </span>
        <div className="super-id">
          <div className="super-name">Super Magic</div>
          <div className="super-status">
            <span className="dot" />
            Ready to edit your flow
          </div>
        </div>
        <button
          type="button"
          className="super-refresh"
          aria-label="Reset conversation"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="super-messages" ref={messagesRef}>
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="msg-row user">
              <div className="msg-bubble">{msg.text}</div>
            </div>
          ) : (
            <div key={msg.id} className="msg-row">
              <span className="msg-avatar" aria-hidden="true">
                AI
              </span>
              <div className="msg-bubble">{msg.text}</div>
            </div>
          )
        )}
      </div>

      <div className="super-suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="suggestion-chip"
            onClick={() => setDraft(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="super-input">
        <div className="super-input-row">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe a flow or ask a follow-up…"
          />
          <button
            type="button"
            className="super-send"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
        <div className="super-input-hint">↩ to send · ⇧↩ for newline</div>
      </div>
    </aside>
  );
}
