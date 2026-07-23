import { OBJECTS_OF_STUDY } from "../config/objects";
import type { ObjectId } from "../types/search";
import { ObjectTile } from "./ObjectTile";

interface ObjectSelectorProps {
  selectedIds: readonly ObjectId[];
  onChange: (ids: ObjectId[]) => void;
}

export function ObjectSelector({ selectedIds, onChange }: ObjectSelectorProps) {
  const selected = new Set(selectedIds);

  function updateSelection(id: ObjectId, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...next]);
  }

  return (
    <fieldset className="selector-fieldset">
      <legend className="sr-only">Objects of Study</legend>
      <div className="object-grid">
        {OBJECTS_OF_STUDY.map((object) => (
          <ObjectTile
            key={object.id}
            object={object}
            selected={selected.has(object.id)}
            onChange={(checked) => updateSelection(object.id, checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}
