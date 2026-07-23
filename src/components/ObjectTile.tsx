import type { ObjectOfStudy } from "../types/search";

interface ObjectTileProps {
  object: ObjectOfStudy;
  selected: boolean;
  onChange: (selected: boolean) => void;
}

export function ObjectTile({ object, selected, onChange }: ObjectTileProps) {
  const inputId = `object-${object.id}`;

  return (
    <label className={selected ? "object-tile object-tile--selected" : "object-tile"} htmlFor={inputId}>
      <input
        id={inputId}
        className="object-tile__input"
        type="checkbox"
        checked={selected}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="object-tile__box" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <span className="object-tile__label">{object.label}</span>
    </label>
  );
}
