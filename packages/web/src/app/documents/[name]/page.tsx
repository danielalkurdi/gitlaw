export default async function DocumentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  return (
    <main>
      <h1>Document: {name}</h1>
      <p>Document viewer will load from gitlaw repo here.</p>
    </main>
  );
}
