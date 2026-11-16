import { ConfigTree } from './components/ConfigTree';

function App() {
  return (
    <div>
      <h1>Temporal Control</h1>
      {/* Temporary: log the selection so we can check the path. */}
      <ConfigTree onSelect={(node) => console.log('selected', node)} />
    </div>
  );
}

export default App;
