interface DocumentSummary {
  name: string;
  title: string;
  type: string;
  status: string;
}

interface DashboardProps {
  documents: DocumentSummary[];
}

export function Dashboard({ documents }: DashboardProps) {
  if (documents.length === 0) {
    return (
      <div>
        <h2>No documents</h2>
        <p>Create a document with <code>gitlaw new</code></p>
      </div>
    );
  }

  return (
    <div>
      <h2>Documents</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.name}>
              <td><a href={`/documents/${doc.name}`}>{doc.name}</a></td>
              <td>{doc.title}</td>
              <td>{doc.type}</td>
              <td>{doc.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
