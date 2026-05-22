export const PRESET_COLORS = [
  { label: "Red",        value: "#CC0000" },
  { label: "Crimson",    value: "#DC143C" },
  { label: "Orange Red", value: "#FF4500" },
  { label: "Orange",     value: "#D45E00" },
  { label: "Amber",      value: "#D4A017" },
  { label: "Gold",       value: "#FFD700" },
  { label: "Yellow",     value: "#DAA520" },
  { label: "Lime",       value: "#6ABF4B" },
  { label: "Green",      value: "#1A8F4A" },
  { label: "Teal",       value: "#0D8C8C" },
  { label: "Cyan",       value: "#0891B2" },
  { label: "Sky Blue",   value: "#0EA5E9" },
  { label: "Blue",       value: "#1A6FCC" },
  { label: "Indigo",     value: "#4F46E5" },
  { label: "Purple",     value: "#7B2FCC" },
  { label: "Violet",     value: "#9333EA" },
  { label: "Pink",       value: "#CC2F7A" },
  { label: "Rose",       value: "#E11D48" },
  { label: "Brown",      value: "#92400E" },
  { label: "Silver",     value: "#7A8694" },
  { label: "White",      value: "#E8E8E8" },
  { label: "Dark Gray",  value: "#4B5563" },
];

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