import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import WoundAnalysis from './components/WoundAnalysis';
import './App.css';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalysisComplete = (result) => {
    setAnalysis(result);
    setLoading(false);
    setError(null);
  };

  const handleAnalysisStart = () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
    setAnalysis(null);
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏥 Wound Analysis System</h1>
        <p className="subtitle">AI-Powered Medical Wound Assessment</p>
      </header>

      <main className="App-main">
        {!analysis && !loading && (
          <ImageUpload
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisStart={handleAnalysisStart}
            onError={handleError}
          />
        )}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing wound image...</p>
            <p className="loading-subtext">This may take 10-20 seconds</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={handleReset} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {analysis && (
          <WoundAnalysis
            analysis={analysis}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>⚕️ For medical professional use only. AI analysis should be verified by qualified healthcare providers.</p>
      </footer>
    </div>
  );
}

export default App;
