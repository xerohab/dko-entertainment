const PRESET_COLORS = [
  { label: "Red",    value: "#CC0000" },
  { label: "Gold",   value: "#D4A017" },
  { label: "Blue",   value: "#1A6FCC" },
  { label: "Green",  value: "#1A8F4A" },
  { label: "Purple", value: "#7B2FCC" },
  { label: "Orange", value: "#D45E00" },
  { label: "Teal",   value: "#0D8C8C" },
  { label: "Pink",   value: "#CC2F7A" },
  { label: "Silver", value: "#7A8694" },
  { label: "White",  value: "#E8E8E8" },
];

export { PRESET_COLORS };

export default function CategoryColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
          style={{
            backgroundColor: c.value,
            borderColor: value === c.value ? "#fff" : "transparent",
            boxShadow: value === c.value ? `0 0 0 2px ${c.value}` : "none",
          }}
        />
      ))}
    </div>
  );
}