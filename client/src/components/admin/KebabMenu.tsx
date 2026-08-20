import { useEffect, useRef, useState } from "react";

interface KebabMenuProps {
  onShare?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export default function KebabMenu({ onShare, onEdit, onDelete }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="kebab" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="kebab__trigger" onClick={() => setOpen((v) => !v)}>
        <i className="fa-solid fa-ellipsis-vertical" />
      </button>
      {open && (
        <div className="kebab__menu">
          {onShare && (
            <button
              onClick={() => {
                setOpen(false);
                onShare();
              }}
            >
              <i className="fa-solid fa-share-nodes" /> Поделиться
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <i className="fa-solid fa-pen" /> Изменить
            </button>
          )}
          <button
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <i className="fa-solid fa-trash" /> Удалить
          </button>
        </div>
      )}
    </div>
  );
}
