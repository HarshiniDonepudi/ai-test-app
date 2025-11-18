import React, { useState } from 'react';
import axios from 'axios';
import './WoundAnalysis.css';

function WoundAnalysis({ analysis, onReset }) {
  const [expandedAlternatives, setExpandedAlternatives] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notes, setNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await axios.post('/api/analyze/approve', {
        diagnosis: analysis.primary_diagnosis,
        notes,
        timestamp: new Date().toISOString()
      });
      setApproved(true);
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to save approval. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const getSeverityColor = (severity) => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('mild')) return '#28a745';
    if (severityLower.includes('moderate')) return '#ffc107';
    if (severityLower.includes('severe')) return '#fd7e14';
    if (severityLower.includes('critical')) return '#dc3545';
    return '#6c757d';
  };

  const getConfidenceColor = (confidence) => {
    const conf = parseInt(confidence);
    if (conf >= 80) return '#28a745';
    if (conf >= 60) return '#ffc107';
    return '#fd7e14';
  };

  return (
    <div className="wound-analysis-container">
      <div className="analysis-header">
        <h2>📋 Wound Analysis Results</h2>
        <button onClick={onReset} className="btn-secondary">
          ← Analyze New Image
        </button>
      </div>

      {/* Primary Diagnosis */}
      <div className="primary-diagnosis">
        <h3>Primary Diagnosis</h3>
        <div className="diagnosis-grid">
          <div className="diagnosis-item">
            <span className="label">Location:</span>
            <span className="value">{analysis.primary_diagnosis.location}</span>
          </div>
          <div className="diagnosis-item">
            <span className="label">Etiology:</span>
            <span className="value">{analysis.primary_diagnosis.etiology}</span>
          </div>
          <div className="diagnosis-item">
            <span className="label">Severity:</span>
            <span
              className="value severity-badge"
              style={{ background: getSeverityColor(analysis.primary_diagnosis.severity) }}
            >
              {analysis.primary_diagnosis.severity}
            </span>
          </div>
          <div className="diagnosis-item">
            <span className="label">Confidence:</span>
            <span
              className="value confidence-badge"
              style={{ background: getConfidenceColor(analysis.primary_diagnosis.confidence) }}
            >
              {analysis.primary_diagnosis.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Wound Characteristics */}
      {analysis.wound_characteristics && (
        <div className="wound-characteristics">
          <h3>Wound Characteristics</h3>
          <div className="characteristics-grid">
            {Object.entries(analysis.wound_characteristics).map(([key, value]) => (
              <div key={key} className="characteristic-item">
                <span className="label">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                <span className="value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Diagnoses */}
      {analysis.alternative_diagnoses && analysis.alternative_diagnoses.length > 0 && (
        <div className="alternative-diagnoses">
          <button
            className="expand-button"
            onClick={() => setExpandedAlternatives(!expandedAlternatives)}
          >
            <span>{expandedAlternatives ? '▼' : '▶'}</span>
            Alternative Diagnoses ({analysis.alternative_diagnoses.length})
          </button>

          {expandedAlternatives && (
            <div className="alternatives-list">
              {analysis.alternative_diagnoses.map((alt, index) => (
                <div key={index} className="alternative-item">
                  <div className="alternative-header">
                    <h4>Alternative {index + 1}</h4>
                    <span
                      className="confidence-badge"
                      style={{ background: getConfidenceColor(alt.confidence) }}
                    >
                      {alt.confidence}%
                    </span>
                  </div>
                  <div className="alternative-details">
                    <p><strong>Location:</strong> {alt.location}</p>
                    <p><strong>Etiology:</strong> {alt.etiology}</p>
                    <p>
                      <strong>Severity:</strong>{' '}
                      <span
                        className="severity-badge-inline"
                        style={{ background: getSeverityColor(alt.severity) }}
                      >
                        {alt.severity}
                      </span>
                    </p>
                    {alt.reasoning && (
                      <p className="reasoning"><strong>Reasoning:</strong> {alt.reasoning}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Treatment Recommendations */}
      {analysis.treatment_recommendations && (
        <div className="treatment-section">
          <h3>💊 Treatment Recommendations</h3>
          <div className="treatment-content">
            {Object.entries(analysis.treatment_recommendations).map(([key, value]) => (
              <div key={key} className="treatment-item">
                <h4>{key.replace(/_/g, ' ').toUpperCase()}</h4>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Section */}
      <div className="approval-section">
        <h3>✅ Doctor Approval</h3>
        {!approved ? (
          <div className="approval-form">
            <textarea
              placeholder="Add clinical notes or corrections (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="notes-input"
            />
            <button
              onClick={handleApprove}
              disabled={approving}
              className="btn-success"
            >
              {approving ? 'Saving...' : '✓ Approve Diagnosis'}
            </button>
          </div>
        ) : (
          <div className="approved-message">
            <div className="checkmark">✓</div>
            <p>Diagnosis approved and saved successfully!</p>
            {notes && (
              <div className="saved-notes">
                <strong>Notes:</strong>
                <p>{notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WoundAnalysis;
