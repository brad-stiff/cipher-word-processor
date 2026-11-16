import type { TabSummary } from "../hooks/useDocument";

interface TabBarProps {
  tabs: TabSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
}: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Documents">
      <div className="tab-bar-scroll">
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className={`tab${selected ? " tab-active" : ""}`}
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(tab.id);
                }
              }}
            >
              <span className="tab-title">
                {tab.title}
                {tab.dirty ? " •" : ""}
              </span>
              <button
                type="button"
                className="tab-close"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="tab-new"
        aria-label="New tab"
        onClick={onNew}
      >
        +
      </button>
    </div>
  );
}
