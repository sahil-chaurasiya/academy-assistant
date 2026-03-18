'use client';
import { useTags, Tag } from '@/lib/useTags';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  readOnly?: boolean;
}

export default function WeaknessTagSelector({ selected, onChange, readOnly = false }: Props) {
  const { tags, loading } = useTags();

  const toggle = (tagName: string) => {
    if (readOnly) return;
    onChange(selected.includes(tagName) ? selected.filter(t => t !== tagName) : [...selected, tagName]);
  };

  if (loading) return <div className="text-xs text-muted">Loading tags…</div>;
  if (!tags.length) return <div className="text-xs text-muted italic">No tags defined — add them in Settings.</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag: Tag) => {
        const isSelected = selected.includes(tag.name);
        return (
          <button
            key={tag._id}
            type="button"
            onClick={() => toggle(tag.name)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 capitalize ${
              isSelected
                ? tag.colorSelected
                : readOnly
                  ? `${tag.color} cursor-default`
                  : `${tag.color} hover:scale-105 cursor-pointer`
            }`}
          >
            {isSelected && !readOnly && <span className="text-[10px]">✕</span>}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

// Keep named export for any pages that still import TAG_COLORS
export function getTagColor(tags: Tag[], name: string) {
  return tags.find(t => t.name === name)?.color || 'bg-parchment text-muted border-parchment';
}
