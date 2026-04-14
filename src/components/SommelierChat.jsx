import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./SommelierChat.module.css";

const SUGGESTIONS = [
  "What wine pairs with salmon?",
  "Explain tannins to me",
  "Bold red under $30?",
  "Best Champagne for a special occasion",
  "Difference between Burgundy and Bordeaux?",
  "Natural wines — worth the hype?",
];

export function SommelierChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg = { role: "user", content: trimmed };
      const history = [...messages, userMsg];

      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);

      try {
        const res = await fetch("/api/sommelier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content:
              "Sorry, I ran into an issue. Please check your API key and try again.",
            isError: true,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setIsStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const lastIsStreaming =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>V</div>
          <div>
            <span className={styles.headerTitle}>Ask Vino</span>
            <span className={styles.headerSub}>Master sommelier · Powered by Claude</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className={styles.resetBtn} onClick={handleReset} title="New conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        )}
      </div>

      {/* Message list */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <div className={styles.welcomeMark}>◈</div>
            <p className={styles.welcomeText}>
              Ask me anything about wine — pairings, regions, grapes, producers,
              or how to navigate a wine list.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={styles.suggestion}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.row} ${
              msg.role === "user" ? styles.userRow : styles.assistantRow
            }`}
          >
            {msg.role === "assistant" && (
              <div className={styles.msgAvatar}>V</div>
            )}
            <div
              className={`${styles.bubble} ${
                msg.role === "user" ? styles.userBubble : styles.assistantBubble
              } ${msg.isError ? styles.errorBubble : ""}`}
            >
              {msg.content ||
                (lastIsStreaming && i === messages.length - 1 ? (
                  <span className={styles.typing}>
                    <span /><span /><span />
                  </span>
                ) : null)}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Ask about wine…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
