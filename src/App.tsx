import { useState } from 'react';
import { ConfigTree } from './components/ConfigTree';
import type { SelectedNode } from './components/ConfigTree';
import { PartDetails } from './components/PartDetails';
import './App.css';

function App() {
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  return (
    <div>
      <h1>Temporal Control</h1>
      <div className="app-layout">
        <div className="app-panel">
          <ConfigTree onSelect={setSelected} />
        </div>
        <div className="app-panel">
          {selected ? (
            // key makes React start fresh when another row is selected,
            // which resets the dropdown and any success/error message.
            <PartDetails key={selected.config.uuid} node={selected} />
          ) : (
            <p>Select a part to see its details</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
