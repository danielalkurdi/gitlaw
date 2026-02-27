import { Dashboard } from '@/components/dashboard';

export default function Home() {
  // Placeholder — will be wired to gitlaw core in local/remote mode
  const documents: { name: string; title: string; type: string; status: string }[] = [];

  return (
    <main>
      <h1>gitlaw</h1>
      <Dashboard documents={documents} />
    </main>
  );
}
