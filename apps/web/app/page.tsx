export default function Home() {
  return <main>
    <p className="label">Milestone 1 · Local foundation</p>
    <h1>Personal Context POC</h1>
    <p>Import local photos into evidence-backed observations using a deterministic mock processor.</p>
    <ol>
      <li>Add images to <code>sample-data/photos</code> or run <code>pnpm demo:fixtures</code>.</li>
      <li>Run <code>pnpm ingest</code> to process and persist them.</li>
      <li>Run <code>pnpm inspect</code> to inspect stored items and observation provenance.</li>
    </ol>
    <p className="note">The mock records image file metadata. Image understanding and personal context inference are planned for later milestones.</p>
  </main>;
}
