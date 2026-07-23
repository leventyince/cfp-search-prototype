import { CALL_TYPES } from "../config/callTypes";
import { OBJECTS_OF_STUDY } from "../config/objects";
import type { CallTypeId, ObjectId, SearchSelection } from "../types/search";

const validObjectIds = new Set<ObjectId>(OBJECTS_OF_STUDY.map((item) => item.id));
const validCallTypeIds = new Set<CallTypeId>(CALL_TYPES.map((item) => item.id));

function parseCommaList(value: string | null): string[] {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

export function selectionFromSearchParams(params: URLSearchParams): SearchSelection {
  const objects = parseCommaList(params.get("objects")).filter(
    (value): value is ObjectId => validObjectIds.has(value as ObjectId),
  );

  const callTypes = parseCommaList(params.get("types")).filter(
    (value): value is CallTypeId => validCallTypeIds.has(value as CallTypeId),
  );

  return {
    objects,
    callTypes: callTypes.length > 0 ? callTypes : CALL_TYPES.map((item) => item.id),
  };
}

export function selectionToSearchParams(selection: SearchSelection): URLSearchParams {
  const params = new URLSearchParams();
  params.set("objects", selection.objects.join(","));
  params.set("types", selection.callTypes.join(","));
  return params;
}
