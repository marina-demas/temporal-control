import { useState } from 'react';
import { ConfigTree } from './components/ConfigTree';
import type { SelectedNode } from './components/ConfigTree';
import { PartDetails } from './components/PartDetails';
import { useOnlineStatus } from './hooks';
import './App.css';

function App() {
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const isOnline = useOnlineStatus();

  return (
    <div className="app">
      {!isOnline && (
        <div role="status" className="offline-banner">
          You're offline. Data will load when your connection returns.
        </div>
      )}
      <header className="app-header">
        <h1>Temporal Control</h1>
      </header>
      <main className="app-layout">
        <section className="app-panel app-panel--tree" aria-label="Configurations">
          <ConfigTree
            selectedUuid={selected?.config.uuid ?? null}
            onSelect={setSelected}
          />
        </section>
        <section className="app-panel app-panel--details" aria-label="Part details">
          {selected ? (
            // key makes React start fresh when another row is selected,
            // which resets the dropdown and any success/error message.
            <PartDetails
              key={selected.config.uuid}
              node={selected}
              onSelect={setSelected}
            />
          ) : (
            <p>
              Select a time machine or part to see its details. Use the arrow (▸) next
              to a row to show its components.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
