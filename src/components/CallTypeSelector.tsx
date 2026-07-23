import { CALL_TYPES } from "../config/callTypes";
import type { CallTypeId } from "../types/search";

interface CallTypeSelectorProps {
  selectedIds: readonly CallTypeId[];
  onChange: (ids: CallTypeId[]) => void;
  compact?: boolean;
}

export function CallTypeSelector({ selectedIds, onChange, compact = false }: CallTypeSelectorProps) {
  const selected = new Set(selectedIds);

  function updateSelection(id: CallTypeId, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...next]);
  }

  return (
    <fieldset className={compact ? "call-types call-types--compact" : "call-types"}>
      <legend>Call types</legend>
      <div className="call-types__options">
        {CALL_TYPES.map((callType) => (
          <label className={selected.has(callType.id) ? "filter-toggle filter-toggle--active" : "filter-toggle"} key={callType.id}>
            <input
              type="checkbox"
              checked={selected.has(callType.id)}
              onChange={(event) => updateSelection(callType.id, event.target.checked)}
            />
            <span>{selected.has(callType.id) ? "× " : ""}{callType.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
