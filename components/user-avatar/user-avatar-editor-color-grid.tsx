import { toCssHexColor } from "@/lib/user-avatar/avatarColorUtils";

type UserAvatarEditorColorGridProps = {
  colors: readonly string[];
  selectedColor: string | undefined;
  onSelect: (color: string) => void;
};

export function UserAvatarEditorColorGrid({
  colors,
  selectedColor,
  onSelect,
}: UserAvatarEditorColorGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
      {colors.map((color) => {
        const isSelected = selectedColor === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className={[
              "aspect-square rounded-2xl border-4 transition-transform hover:scale-105",
              isSelected
                ? "border-blue ring-2 ring-blue/30"
                : "border-transparent hover:border-border",
            ].join(" ")}
            style={{ backgroundColor: toCssHexColor(color) }}
            aria-label={color}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
}
