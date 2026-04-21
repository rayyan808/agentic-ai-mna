import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:3000";

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseInline(text, keyPrefix) {
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const k = `${keyPrefix}-${idx++}`;
    if (token.startsWith("`")) {
      parts.push(
        <code key={k} style={{
          fontFamily: "'IBM Plex Mono', monospace",
          background: "var(--color-background-tertiary)",
          padding: "1px 5px",
          borderRadius: 3,
          fontSize: "0.88em",
        }}>{token.slice(1, -1)}</code>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={k}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={k}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownText({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    const h3m = line.match(/^### (.+)/);
    const h2m = line.match(/^## (.+)/);
    const h1m = line.match(/^# (.+)/);

    if (h1m) {
      elements.push(
        <p key={i} style={{ margin: "10px 0 4px", fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {parseInline(h1m[1], `h1-${i}`)}
        </p>
      );
    } else if (h2m) {
      elements.push(
        <p key={i} style={{ margin: "8px 0 4px", fontSize: 14, fontWeight: 650, color: "var(--color-text-primary)" }}>
          {parseInline(h2m[1], `h2-${i}`)}
        </p>
      );
    } else if (h3m) {
      elements.push(
        <p key={i} style={{ margin: "6px 0 4px", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {parseInline(h3m[1], `h3-${i}`)}
        </p>
      );
    } else if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(
          <li key={i} style={{ marginBottom: 3 }}>
            {parseInline(lines[i].slice(2), `li-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "4px 0", paddingLeft: 20 }}>{items}</ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          <li key={i} style={{ marginBottom: 3 }}>
            {parseInline(lines[i].replace(/^\d+\. /, ""), `oli-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "4px 0", paddingLeft: 20 }}>{items}</ol>
      );
      continue;
    } else {
      elements.push(
        <p key={i} style={{ margin: "0 0 6px", lineHeight: 1.6 }}>
          {parseInline(line, `p-${i}`)}
        </p>
      );
    }
    i++;
  }

  return (
    <div style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
      {elements}
    </div>
  );
}

// ─── UI Components ───────────────────────────────────────────────────────────

function ToolCallCard({ name, done }) {
  const isQuery = name.includes('query');

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      margin: "6px 0",
      padding: "8px 12px",
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 8,
      fontFamily: "monospace",
      fontSize: 13,
      background: "var(--color-background-secondary)",
    }}>
      <span style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "monospace",
        background: isQuery ? "#E1F5EE" : "#FAEEDA",
        color: isQuery ? "#0F6E56" : "#854F0B",
      }}>
        {isQuery ? "QUERY" : "OP"}
      </span>
      <span style={{ color: "var(--color-text-primary)", fontWeight: 500, flex: 1 }}>
        {name}
      </span>
      <span style={{ fontSize: 11, color: done ? "#0F6E56" : "var(--color-text-tertiary)" }}>
        {done ? "✓ done" : "running…"}
      </span>
    </div>
  );
}

function AgentMessage({ events }) {
  const finalEvent = events.find(e => e.type === "final");
  const errorEvent = events.find(e => e.type === "error");

  // Build ordered tool call list from tool_start / tool_end pairs
  const toolCalls = [];
  for (const ev of events) {
    if (ev.type === "tool_start") {
      toolCalls.push({ name: ev.data, done: false });
    } else if (ev.type === "tool_end") {
      for (let i = toolCalls.length - 1; i >= 0; i--) {
        if (toolCalls[i].name === ev.data && !toolCalls[i].done) {
          toolCalls[i].done = true;
          break;
        }
      }
    }
  }

  const streamText = !finalEvent
    ? events.filter(e => e.type === "token").map(e => e.data).join("")
    : null;

  return (
    <div style={{ marginBottom: 16 }}>
      {toolCalls.map((tc, i) => (
        <ToolCallCard key={i} name={tc.name} done={tc.done} />
      ))}
      {streamText && (
        <MarkdownText text={streamText} />
      )}
      {finalEvent && (
        <div style={{ marginTop: toolCalls.length ? 8 : 0 }}>
          <MarkdownText text={finalEvent.data} />
        </div>
      )}
      {errorEvent && (
        <div style={{ marginTop: 8, color: "#c0392b" }}>
          <MarkdownText text={errorEvent.data} />
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--color-text-tertiary)",
          display: "inline-block",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [privateKey, setPrivateKey] = useState("");
  const [evmAddress, setEvmAddress] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [model, setModel] = useState("claude");
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      setEvmAddress(accounts[0] ?? "");
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask to continue.");
      return;
    }
    setWalletConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setEvmAddress(accounts[0] ?? "");
    } catch {
      // user rejected
    } finally {
      setWalletConnecting(false);
    }
  }

  function handleSubmit() {
    if (!goal.trim() || running || !evmAddress) return;
    const userGoal = goal.trim();
    setGoal("");
    setRunning(true);

    setMessages(prev => [
      ...prev,
      { role: "user", text: userGoal },
      { role: "agent", events: [], pending: true },
    ]);

    const params = new URLSearchParams({
      message: userGoal,
      privateKey: privateKey,
      model: model,
      sessionId: sessionId.current,
      evmAddress: evmAddress,
    });
    const es = new EventSource(`${API_URL}/chat/stream?${params}`);
    let agentEvents = [];
    let finished = false;

    const addEvent = (event) => {
      agentEvents = [...agentEvents, event];
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], events: agentEvents };
        return copy;
      });
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      es.close();
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], pending: false };
        return copy;
      });
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    ["token", "tool_start", "tool_end", "final", "error"].forEach(eventType => {
      es.addEventListener(eventType, (e) => {
        const data = JSON.parse(e.data);
        addEvent({ type: eventType, data });
        if (eventType === "error") finish();
      });
    });

    es.addEventListener("done", () => finish());

    es.onerror = () => {
      addEvent({ type: "error", data: "Connection to API lost." });
      finish();
    };
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap');
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus, input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-border-secondary); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 4px; }
      `}</style>

      <div style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 780,
        margin: "0 auto",
        padding: "0 16px",
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0 12px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1D9E75, #0F6E56)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>🌾</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)" }}>
                MNA Agent
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                My Neighbor Alice · Chromia
              </div>
            </div>
          </div>

          {evmAddress ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              border: "0.5px solid #1D9E75",
              borderRadius: 20,
              fontSize: 12,
              fontFamily: "monospace",
              color: "#1D9E75",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />
              {evmAddress.slice(0, 6)}…{evmAddress.slice(-4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={walletConnecting}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "0.5px solid var(--color-border-secondary)",
                background: "transparent",
                color: "var(--color-text-primary)",
                cursor: walletConnecting ? "not-allowed" : "pointer",
                fontSize: 13,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {walletConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* Private key + model */}
        <div style={{
          padding: "12px 0",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          flexShrink: 0,
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 4, fontFamily: "monospace" }}>
              PRIVATE KEY
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
              }}
              placeholder="Enter your private key"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 4, fontFamily: "monospace" }}>
              MODEL
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{
                padding: "8px 10px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
              }}
            >
              <option value="claude">Claude</option>
              <option value="openAI">OpenAI</option>
            </select>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
              {!evmAddress ? (
                <p style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                  Connect your EVM wallet to start chatting with the agent.
                </p>
              ) : (
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                Give the agent a goal.<br />
                
              </p>
              )}
              {evmAddress && <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                
              </div>}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}>
              {msg.role === "user" ? (
                <div style={{
                  maxWidth: "75%",
                  padding: "10px 14px",
                  background: "var(--color-background-info)",
                  color: "var(--color-text-info)",
                  borderRadius: "12px 12px 2px 12px",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              ) : (
                <div style={{ maxWidth: "90%", width: "100%" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: "#1D9E75",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                    }}>🤖</div>
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                      agent
                    </span>
                  </div>
                  {msg.pending && msg.events.length === 0 ? (
                    <ThinkingDots />
                  ) : (
                    <AgentMessage events={msg.events} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          padding: "12px 0 16px",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 10,
            padding: "8px 8px 8px 12px",
            background: "var(--color-background-secondary)",
          }}>
            <textarea
              ref={inputRef}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={handleKey}
              disabled={running || !evmAddress}
              placeholder={evmAddress ? "Give the agent a goal…" : "Connect your wallet to start…"}
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                background: "transparent",
                fontSize: 14,
                fontFamily: "'IBM Plex Sans', sans-serif",
                color: "var(--color-text-primary)",
                lineHeight: 1.5,
                outline: "none",
                boxShadow: "none",
                maxHeight: 120,
                overflow: "auto",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!goal.trim() || running || !evmAddress}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: (running || !evmAddress) ? "var(--color-background-tertiary)" : "#1D9E75",
                color: (running || !evmAddress) ? "var(--color-text-tertiary)" : "#fff",
                cursor: (running || !evmAddress) ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans', sans-serif",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              {running ? "running…" : "run"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6, textAlign: "center" }}>
            Agent runs on the API server · operations require you to input your private key
          </p>
        </div>
      </div>
    </>
  );
}
