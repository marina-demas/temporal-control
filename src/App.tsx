import { useState } from 'react';
import { ConfigTree } from './components/ConfigTree';
import type { SelectedNode } from './components/ConfigTree';
import { PartDetails } from './components/PartDetails';
import './App.css';

function App() {
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Temporal Control</h1>
      </header>
      <main className="app-layout">
        <section className="app-panel app-panel--tree" aria-label="Configurations">
          <ConfigTree onSelect={setSelected} />
        </section>
        <section className="app-panel app-panel--details" aria-label="Part details">
          {selected ? (
            // key makes React start fresh when another row is selected,
            // which resets the dropdown and any success/error message.
            <PartDetails key={selected.config.uuid} node={selected} />
          ) : (
            <p>Select a part to see its details</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
