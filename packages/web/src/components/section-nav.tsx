'use client';

interface SectionNavProps {
  sections: { id: string; file: string }[];
  activeSection?: string;
  onSelect: (id: string) => void;
}

export function SectionNav({ sections, activeSection, onSelect }: SectionNavProps) {
  return (
    <nav>
      <h3>Sections</h3>
      <ul>
        {sections.map(s => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              style={{ fontWeight: activeSection === s.id ? 'bold' : 'normal' }}
            >
              {s.id}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
