import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:3000";

// ─── UI Components ───────────────────────────────────────────────────────────

function ToolCallCard({ name, input, result }) {
  const [open, setOpen] = useState(false);
  const isQuery = name === "get_ft4_inventory";

  return (
    <div style={{
      margin: "6px 0",
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 8,
      overflow: "hidden",
      fontFamily: "monospace",
      fontSize: 13,
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          cursor: "pointer",
          background: "var(--color-background-secondary)",
          userSelect: "none",
        }}
      >
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
        <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
          {name}
        </span>
        {result?.success && (
          <span style={{ marginLeft: "auto", color: "#0F6E56", fontSize: 11 }}>
            ✓ {result.tx_rid ? `tx: ${result.tx_rid.slice(0, 10)}…` : "ok"}
          </span>
        )}
        <span style={{ color: "var(--color-text-tertiary)", fontSize: 11 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--color-border-tertiary)" }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>INPUT</span>
            <pre style={{
              margin: "4px 0 0",
              padding: "8px",
              background: "var(--color-background-tertiary)",
              borderRadius: 4,
              fontSize: 12,
              overflowX: "auto",
              color: "var(--color-text-primary)",
            }}>
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>RESULT</span>
              <pre style={{
                margin: "4px 0 0",
                padding: "8px",
                background: "var(--color-background-tertiary)",
                borderRadius: 4,
                fontSize: 12,
                overflowX: "auto",
                color: "var(--color-text-primary)",
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentMessage({ events }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {events.map((ev, i) => {
        if (ev.type === "thought") return (
          <p key={i} style={{
            margin: "0 0 8px",
            color: "var(--color-text-primary)",
            lineHeight: 1.6,
            fontSize: 14,
          }}>{ev.text}</p>
        );
        if (ev.type === "tool_call") {
          const result = events.find(
            (e, j) => j > i && e.type === "tool_result" && e.name === ev.name
          )?.result;
          return <ToolCallCard key={i} name={ev.name} input={ev.input} result={result} />;
        }
        if (ev.type === "done" || ev.type === "error") return (
          <p key={i} style={{
            margin: "8px 0 0",
            color: ev.type === "error" ? "#c0392b" : "var(--color-text-primary)",
            lineHeight: 1.6,
            fontSize: 14,
            fontWeight: 500,
          }}>{ev.text}</p>
        );
        return null;
      })}
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
  const [accountId, setAccountId] = useState("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2");
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit() {
    if (!goal.trim() || running) return;
    const userGoal = goal.trim();
    setGoal("");
    setRunning(true);

    setMessages(prev => [
      ...prev,
      { role: "user", text: userGoal },
      { role: "agent", events: [], pending: true },
    ]);

    const params = new URLSearchParams({ goal: userGoal, accountId });
    const es = new EventSource(`${API_URL}/agent/run?${params}`);
    let agentEvents = [];

    const finish = () => {
      es.close();
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], pending: false };
        return copy;
      });
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      agentEvents = [...agentEvents, event];
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], events: agentEvents };
        return copy;
      });
      if (event.type === "done" || event.type === "error") finish();
    };

    es.onerror = () => {
      agentEvents = [...agentEvents, { type: "error", text: "Connection to API lost." }];
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], events: agentEvents };
        return copy;
      });
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
          <button
            onClick={() => setConfigOpen(!configOpen)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 6,
              background: "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {configOpen ? "hide config" : "config"}
          </button>
        </div>

        {/* Config panel */}
        {configOpen && (
          <div style={{
            padding: "12px 0",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            flexShrink: 0,
          }}>
            <label style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 4, fontFamily: "monospace" }}>
              ACCOUNT ID (hex byte_array)
            </label>
            <input
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
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
              placeholder="Paste your Chromia account ID (hex)"
            />
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6, lineHeight: 1.5 }}>
              In production: connect via MetaMask → ft4 derives this from your EVM address.
              For now, paste your account_id directly.
            </p>
          </div>
        )}

        {/* Chat messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                Give the agent a goal.<br />
                It will query your inventory and execute operations autonomously.
              </p>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                {[
                  "Check my current inventory",
                  "Buy 5 carrot seeds from the general store",
                  "Buy 10 water buckets and 20 carrot seeds from general_store",
                ].map(s => (
                  <button key={s} onClick={() => setGoal(s)} style={{
                    padding: "7px 14px",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: 20,
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
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
              disabled={running}
              placeholder="Give the agent a goal…"
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
              disabled={!goal.trim() || running}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: running ? "var(--color-background-tertiary)" : "#1D9E75",
                color: running ? "var(--color-text-tertiary)" : "#fff",
                cursor: running ? "not-allowed" : "pointer",
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
            Agent runs on the API server · buy_items requires a wallet session (MetaMask + ft4)
          </p>
        </div>
      </div>
    </>
  );
}
