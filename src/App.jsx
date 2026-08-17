import React, { useState, useMemo, useEffect, useRef } from "react";

const HUES = [
  "#EF6F6C",
  "#F0A868",
  "#E8C547",
  "#8FBF63",
  "#4FB0A5",
  "#5B9BD5",
  "#7C77F0",
  "#B07CDB",
  "#E07CB0",
  "#9B9B9B",
];

function buildDeck() {
  const values = [...Array(10).keys()].map((n) => n + 1);
  const deck = [...values, ...values].map((value, i) => ({
    id: i,
    value,
  }));
  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const TOTAL_PAIRS = 10;
const START_LIVES = 10;

export default function MemoryMatching() {
  const [cards] = useState(buildDeck);
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [mismatchPending, setMismatchPending] = useState(false);
  const [matches, setMatches] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [flips, setFlips] = useState(0);

  const boardRef = useRef(null);
  const prevSelectedCount = useRef(0);

  const gameOver = lives <= 0 || matches >= TOTAL_PAIRS;
  const won = matches >= TOTAL_PAIRS;
  const lost = lives <= 0 && !won;

  // Track how many times the player has flipped a card face-up, using the
  // effect hook to react to selection changes rather than counting inline.
  useEffect(() => {
    if (selectedIds.length > prevSelectedCount.current) {
      setFlips((f) => f + 1);
    }
    prevSelectedCount.current = selectedIds.length;
  }, [selectedIds]);

  function cardById(id) {
    return cards.find((c) => c.id === id);
  }

  function handleBoardClick(e) {
    if (gameOver) return;

    const cardEl = e.target.closest("[data-card-id]");
    const clickedId = cardEl ? Number(cardEl.dataset.cardId) : null;

    // Resolve a pending mismatch first — any click (card or empty space)
    // flips the two unmatched cards back down.
    if (mismatchPending) {
      setSelectedIds([]);
      setMismatchPending(false);
      if (clickedId !== null && !matchedIds.has(clickedId)) {
        setSelectedIds([clickedId]);
      }
      return;
    }

    if (clickedId === null) return;
    if (matchedIds.has(clickedId)) return;
    if (selectedIds.includes(clickedId)) return;
    if (selectedIds.length >= 2) return;

    if (selectedIds.length === 0) {
      setSelectedIds([clickedId]);
      return;
    }

    const newSelected = [...selectedIds, clickedId];
    setSelectedIds(newSelected);

    const a = cardById(newSelected[0]);
    const b = cardById(newSelected[1]);

    if (a.value === b.value) {
      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(a.id);
        next.add(b.id);
        return next;
      });
      setMatches((m) => m + 1);
      setSelectedIds([]);
    } else {
      setLives((l) => Math.max(0, l - 1));
      setMismatchPending(true);
    }
  }

  function isFaceUp(id) {
    return matchedIds.has(id) || selectedIds.includes(id);
  }

  const statusText = won ? "You WIN" : lost ? "You LOSE" : "";

  return (
    <div
      style={{
        "--bg": "#ffffff",
        "--panel-border": "#E7E7ED",
        "--card-border": "#D9D9E2",
        "--card-border-hover": "#B8B8C6",
        "--card-face": "#FAFAFB",
        "--text": "#3F3F46",
        "--muted": "#9A9AA6",
        "--accent": "#6E68F2",
        "--win": "#4FB0A5",
        "--lose": "#EF6F6C",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
        background: "var(--bg)",
        maxWidth: 640,
        margin: "0 auto",
        borderRadius: 16,
        border: "1px solid var(--panel-border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "18px 0 14px",
          fontSize: 13,
          letterSpacing: "0.06em",
          color: "var(--muted)",
          textTransform: "uppercase",
        }}
      >
        Memory Matching
      </div>

      <div
        ref={boardRef}
        onClick={handleBoardClick}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          columnGap: "clamp(20px, 6vw, 44px)",
          rowGap: 14,
          padding: "8px 32px 28px",
        }}
      >
        {cards.map((card) => {
          const faceUp = isFaceUp(card.id);
          const matched = matchedIds.has(card.id);
          const hue = HUES[card.value - 1];
          return (
            <button
              key={card.id}
              data-card-id={card.id}
              disabled={gameOver}
              aria-label={faceUp ? `Card showing ${card.value}` : "Hidden card"}
              style={{
                appearance: "none",
                cursor: gameOver ? "default" : "pointer",
                aspectRatio: "1 / 1",
                width: "100%",
                border: `1.5px solid ${matched ? hue : "var(--card-border)"}`,
                borderRadius: 10,
                background: matched ? `${hue}14` : "var(--card-face)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                outline: "none",
                transition:
                  "border-color 160ms ease, background 160ms ease, transform 160ms ease",
              }}
              onFocus={(e) => {
                if (!gameOver)
                  e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = matched
                  ? hue
                  : "var(--card-border)";
              }}
              onMouseEnter={(e) => {
                if (!faceUp && !gameOver)
                  e.currentTarget.style.borderColor =
                    "var(--card-border-hover)";
              }}
              onMouseLeave={(e) => {
                if (!faceUp && !gameOver)
                  e.currentTarget.style.borderColor = "var(--card-border)";
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontVariantNumeric: "tabular-nums",
                  color: faceUp
                    ? matched
                      ? hue
                      : "var(--text)"
                    : "transparent",
                  fontWeight: matched ? 600 : 400,
                  transform: faceUp ? "scale(1)" : "scale(0.6)",
                  transition: "transform 160ms ease, color 160ms ease",
                }}
              >
                {card.value}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--panel-border)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontSize: 13.5,
          color: "var(--muted)",
        }}
      >
        <span>
          Match: <span style={{ color: "var(--text)" }}>{matches}</span>
        </span>
        <span>
          Live:{" "}
          <span style={{ color: lost ? "var(--lose)" : "var(--text)" }}>
            {lives}
          </span>
        </span>
        {statusText && (
          <span
            style={{
              marginLeft: "auto",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: won ? "var(--win)" : "var(--lose)",
            }}
          >
            {statusText}
          </span>
        )}
        <span style={{ marginLeft: statusText ? 0 : "auto", opacity: 0.6 }}>
          Flips: {flips}
        </span>
      </div>
    </div>
  );
}
