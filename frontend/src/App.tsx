import { ThemeProvider } from './components/Common/ThemeProvider';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import DashboardContainer from './components/Dashboard/DashboardContainer';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <header className="bg-surface shadow p-4 border-b border-border flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary">Modular Dashboard</h1>
          </header>
          <main className="p-4 h-[calc(100vh-64px)]">
            <DashboardContainer />
          </main>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
