import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Title } from "../../api/types";
import { api } from "../../api/client";
import { logout } from "../auth/AuthGate";

interface TopBarProps {
  title: Title;
  currentStudioName: string | null;
  onInfoClick: () => void;
  onShareClick: () => void;
}

export default function TopBar({ title, currentStudioName, onInfoClick, onShareClick }: TopBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Title[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await api.search(query));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="player-topbar">
      <div className="player-topbar__left">
        <div className="player-topbar__title">{title.name}</div>
        {currentStudioName && (
          <span className="studio-badge">
            <i className="fa-solid fa-microphone" />
            {currentStudioName}
          </span>
        )}
      </div>

      <div className="player-topbar__actions">
        <div className="player-topbar__right" ref={searchBoxRef}>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder="Поиск тайтла или серии..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
          </div>
          {searchOpen && results.length > 0 && (
            <div className="search-results">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="search-results__item"
                  onClick={() => {
                    navigate(`/title/${r.id}`);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                >
                  {r.posterUrlMobile && <img src={r.posterUrlMobile} alt="" />}
                  <span>{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="player-topbar__icon-btn" onClick={() => navigate("/")} title="К каталогу">
          <i className="fa-solid fa-house" />
        </button>
        <button className="player-topbar__icon-btn" onClick={onInfoClick} title="Информация о тайтле">
          <i className="fa-solid fa-exclamation" />
        </button>
        <button className="player-topbar__icon-btn" onClick={onShareClick} title="Поделиться">
          <i className="fa-solid fa-share-nodes" />
        </button>
        <button className="player-topbar__icon-btn" onClick={logout} title="Выйти">
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </div>
    </div>
  );
}
