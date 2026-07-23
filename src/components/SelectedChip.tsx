interface SelectedChipProps {
  label: string;
  onRemove: () => void;
}

export function SelectedChip({ label, onRemove }: SelectedChipProps) {
  return (
    <button className="selection-chip" type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
      <span aria-hidden="true">×</span>
      <span>{label}</span>
    </button>
  );
}
