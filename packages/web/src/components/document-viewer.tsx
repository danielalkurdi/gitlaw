'use client';

interface DocumentViewerProps {
  title: string;
  type: string;
  status: string;
  parties: { name: string; role: string }[];
  sections: { id: string; content: string }[];
}

export function DocumentViewer({ title, type, status, parties, sections }: DocumentViewerProps) {
  return (
    <article>
      <header>
        <h1>{title}</h1>
        <span>{type}</span>
        <span>{status}</span>
      </header>

      {parties.length > 0 && (
        <section>
          <h2>Parties</h2>
          <ul>
            {parties.map((p, i) => (
              <li key={i}>{p.name} ({p.role})</li>
            ))}
          </ul>
        </section>
      )}

      {sections.map(s => (
        <section key={s.id} id={s.id}>
          <pre>{s.content}</pre>
        </section>
      ))}
    </article>
  );
}
