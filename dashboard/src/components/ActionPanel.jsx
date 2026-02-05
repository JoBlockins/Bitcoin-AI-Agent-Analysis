import SectionExplainer from './SectionExplainer';

const ACTION_CONFIG = {
  WAIT: {
    color: 'neutral',
    label: 'WAIT',
    description: 'No clear edge — hold current position',
  },
  FAVORABLE: {
    color: 'positive',
    label: 'FAVORABLE',
    description: 'Conditions lean positive — could consider adding',
  },
  CAUTION: {
    color: 'negative',
    label: 'CAUTION',
    description: 'Conditions lean negative — could consider reducing',
  },
};

function ConditionRow({ condition }) {
  const status = condition.met ? 'met' : condition.caution ? 'caution' : 'neutral';
  const icon = condition.met ? '✓' : condition.caution ? '!' : '—';

  return (
    <div className={`condition-row condition-${status}`}>
      <span className="condition-icon">{icon}</span>
      <div className="condition-content">
        <div className="condition-header">
          <span className="condition-name">{condition.name}</span>
          <span className="condition-value">{condition.value}</span>
        </div>
        <span className="condition-description">{condition.description}</span>
      </div>
    </div>
  );
}

export default function ActionPanel({ evaluation }) {
  if (!evaluation) return null;

  const { action, reason, conditions } = evaluation;
  const config = ACTION_CONFIG[action] || ACTION_CONFIG.WAIT;

  const metCount = conditions.filter(c => c.met).length;
  const totalCount = conditions.length;

  return (
    <div className={`card action-panel action-panel-${config.color}`}>
      <div className="action-header">
        <div className="action-badge-container">
          <span className={`action-badge action-badge-${config.color}`}>
            {config.label}
          </span>
          <span className="action-description">{config.description}</span>
        </div>
        <span className="action-score">{metCount}/{totalCount} favorable</span>
      </div>

      <p className="action-reason">{reason}</p>

      <div className="conditions-grid">
        {conditions.map((c) => (
          <ConditionRow key={c.name} condition={c} />
        ))}
      </div>

      <SectionExplainer>
        <p><strong>WAIT</strong> — Default state. No clear edge in either direction. Most of the time, doing nothing is correct.</p>
        <p><strong>FAVORABLE</strong> — Multiple conditions align positively. Doesn't mean "buy now" — means conditions are better than average for adding exposure.</p>
        <p><strong>CAUTION</strong> — One or more warning signs present. Consider whether current exposure is appropriate. Doesn't mean "sell everything."</p>
        <p>This framework identifies conditions, not timing. The decision is always yours.</p>
      </SectionExplainer>
    </div>
  );
}
