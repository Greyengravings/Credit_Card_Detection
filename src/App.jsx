import React, { useState } from "react";

const iconPaths = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  insights: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
      <path d="M16 6h4v4" />
    </>
  ),
  model: (
    <>
      <path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  explore: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
      <path d="M11 8v6M8 11h6" />
    </>
  ),
  method: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h8" />
    </>
  ),
  arrow: (
    <>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="m18 6-12 12M6 6l12 12" />
    </>
  ),
};

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

const navigation = [
  { label: "Overview", id: "overview", icon: "overview" },
  { label: "Key insights", id: "insights", icon: "insights" },
  { label: "Model results", id: "model", icon: "model" },
  { label: "Risk explorer", id: "explorer", icon: "explore" },
  { label: "Methodology", id: "methodology", icon: "method" },
];

const features = [
  { name: "PAY_1", detail: "Most recent repayment status", value: 0.246 },
  { name: "PAY_2", detail: "Repayment status · 2 months ago", value: 0.119 },
  { name: "PAY_3", detail: "Repayment status · 3 months ago", value: 0.079 },
  { name: "PAY_AMT1", detail: "Most recent payment amount", value: 0.061 },
  { name: "BILL_AMT1", detail: "Most recent bill amount", value: 0.057 },
];

const preprocessingSteps = [
  { title: "Clean", detail: "Removed duplicates; no missing values found." },
  { title: "Prepare", detail: "Merged invalid category codes; capped outliers." },
  { title: "Transform", detail: "One-hot encoding and correlation filtering." },
  { title: "Evaluate", detail: "Stratified 80/20 split; scaling in pipeline." },
];

const studentProfiles = [
  { name: "Aryaman Sinha", initials: "AS", color: "profile-avatar-aryaman" },
  { name: "Prem Narayani", initials: "PN", color: "profile-avatar-prem" },
  { name: "Drishti Ochani", initials: "DO", color: "profile-avatar-drishti" },
];

function Sidebar({ activeSection, onNavigate, isOpen, onClose, profile, onProfileChange }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
        <a className="brand" href="#overview" onClick={onClose}>
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">ledger<span>wise</span></span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">CR</span>
          <span className="workspace-copy">
            <span className="workspace-label">WORKSPACE</span>
            <span className="workspace-title">Credit risk study</span>
          </span>
          <Icon name="chevron" size={15} />
        </div>

        <p className="nav-heading">ANALYSIS</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              key={item.id}
              className={`nav-link${activeSection === item.id ? " nav-link-active" : ""}`}
              href={`#${item.id}`}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === "explorer" && <span className="nav-new">TRY</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon"><Icon name="layers" size={17} /></span>
            <span>
              <strong>Built from research</strong>
              <small>Data Mining · Mini Project</small>
            </span>
          </div>
          <div className="profile-switcher">
            {profileMenuOpen && (
              <div className="profile-menu" role="menu" aria-label="Select student researcher">
                <span className="profile-menu-heading">STUDENT RESEARCHERS</span>
                {studentProfiles.map((option) => (
                  <button
                    className={`profile-option${option.name === profile.name ? " profile-option-active" : ""}`}
                    key={option.name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.name === profile.name}
                    onClick={() => {
                      onProfileChange(option);
                      setProfileMenuOpen(false);
                    }}
                  >
                    <span className={`profile-avatar ${option.color}`}>{option.initials}</span>
                    <span>{option.name}</span>
                    {option.name === profile.name && <span className="profile-selected-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
            <button
              className="profile profile-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span className={`profile-avatar ${profile.color}`}>{profile.initials}</span>
              <span className="profile-copy">
                <strong>{profile.name}</strong>
                <small>Student researcher</small>
              </span>
              <span className="profile-dots" aria-hidden="true">···</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function MetricCard({ icon, label, value, note, tone }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}><Icon name={icon} size={17} /></span>
        <span className="metric-label">{label}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function OverviewHero() {
  return (
    <section className="hero-panel" aria-labelledby="hero-title">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-copy">
        <div className="hero-label"><span className="pulse-dot" /> CREDIT RISK INTELLIGENCE</div>
        <h2 id="hero-title">See the signals<br />before default.</h2>
        <p>
          A data-led look at what shapes next-month credit card default —
          and why repayment behaviour matters most.
        </p>
        <a className="hero-link" href="#insights">
          Explore the findings <Icon name="arrow" size={16} />
        </a>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orbit orbit-outer" />
        <div className="orbit orbit-inner" />
        <div className="hero-ring">
          <div className="hero-ring-center">
            <span>MODEL AUC</span>
            <strong>0.77</strong>
            <small>Random Forest</small>
          </div>
        </div>
        <span className="orbit-label orbit-label-top">BEHAVIOUR</span>
        <span className="orbit-label orbit-label-bottom">PREDICTIVE SIGNAL</span>
        <span className="hero-spark spark-one" />
        <span className="hero-spark spark-two" />
      </div>
      <div className="hero-footer">
        <span className="dataset-source"><span className="source-dot" /> UCI CREDIT CARD DEFAULT DATASET</span>
        <span className="hero-footer-divider" />
        <span>Banking &amp; finance</span>
        <span className="hero-footer-right">A research overview <Icon name="arrow" size={13} /></span>
      </div>
    </section>
  );
}

function FeatureImportance() {
  return (
    <article className="panel feature-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WHAT THE MODEL LEARNED</span>
          <h3>Repayment history leads</h3>
          <p>Top feature importance · Random Forest</p>
        </div>
        <span className="panel-icon"><Icon name="insights" size={18} /></span>
      </div>
      <div className="feature-list">
        {features.map((feature, index) => (
          <div className="feature-row" key={feature.name}>
            <div className="feature-label">
              <span className={`feature-rank${index === 0 ? " feature-rank-first" : ""}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="feature-name-wrap">
                <strong>{feature.name}</strong>
                <small>{feature.detail}</small>
              </span>
              <span className="feature-value">{feature.value.toFixed(3)}</span>
            </div>
            <div className="feature-track">
              <span style={{ width: `${(feature.value / features[0].value) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="feature-footnote">
        <span className="insight-check"><Icon name="arrow" size={13} /></span>
        Recent payment delays are more informative than demographics.
      </div>
    </article>
  );
}

function BehaviorPanel() {
  return (
    <article className="panel behavior-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">BEHAVIOUR SIGNAL</span>
          <h3>Delays change the picture</h3>
          <p>Default likelihood rises with repayment delay.</p>
        </div>
        <span className="panel-icon panel-icon-coral"><Icon name="clock" size={18} /></span>
      </div>
      <div className="behavior-visual" aria-label="Qualitative illustration of increasing risk with repayment delay">
        <div className="behavior-axis">
          <span>LOWER</span>
          <span>HIGHER RISK</span>
        </div>
        <div className="behavior-bars">
          <div className="behavior-column">
            <div className="behavior-bar behavior-bar-one"><span /></div>
            <span className="behavior-category">On time</span>
          </div>
          <div className="behavior-column">
            <div className="behavior-bar behavior-bar-two"><span /></div>
            <span className="behavior-category">1 month late</span>
          </div>
          <div className="behavior-column">
            <div className="behavior-bar behavior-bar-three"><span /></div>
            <span className="behavior-category">2+ months late</span>
          </div>
        </div>
        <div className="behavior-annotation">
          <span className="annotation-line" />
          <span>Direction shown, not to scale</span>
        </div>
      </div>
      <div className="behavior-callout">
        <span className="callout-indicator" />
        <p><strong>Early intervention matters.</strong> The report identifies recent repayment status as the clearest pattern in the dataset.</p>
      </div>
    </article>
  );
}

function DatasetPanel() {
  return (
    <article className="panel dataset-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">THE DATA</span>
          <h3>A substantial signal, an uneven split</h3>
          <p>Default of Credit Card Clients · Taiwan, 2005</p>
        </div>
        <span className="panel-icon panel-icon-violet"><Icon name="users" size={18} /></span>
      </div>
      <div className="class-distribution">
        <div className="distribution-copy">
          <strong>Most customers repaid.</strong>
          <span>Default is the minority outcome, so accuracy alone can be misleading.</span>
        </div>
        <div className="distribution-value">
          <strong>22<span>%</span></strong>
          <small>DEFAULTED</small>
        </div>
      </div>
      <div className="distribution-track" role="img" aria-label="About 22 percent defaulted and 78 percent did not">
        <span className="distribution-default" />
        <span className="distribution-no-default" />
      </div>
      <div className="distribution-legend">
        <span><i className="legend-dot legend-default" /> Defaulted <strong>~22%</strong></span>
        <span><i className="legend-dot legend-no-default" /> No default <strong>~78%</strong></span>
      </div>
      <div className="dataset-meta">
        <span><strong>30,000</strong> original records</span>
        <span><strong>24</strong> columns</span>
        <span><strong>80 / 20</strong> train / test split</span>
      </div>
    </article>
  );
}

function ModelPanel() {
  return (
    <section id="model" className="model-section">
      <SectionHeading
        eyebrow="MODEL PERFORMANCE"
        title="A useful signal, not a crystal ball."
        description="The report compares three classifiers. Only the Random Forest summary metrics are filled in."
      />
      <div className="model-layout">
        <article className="panel model-card model-card-featured">
          <div className="model-card-top">
            <div className="model-icon"><Icon name="layers" size={19} /></div>
            <span className="model-status"><span /> BEST REPORTED MODEL</span>
          </div>
          <h3>Random Forest</h3>
          <p>200 trees · max depth 10 · balanced class weights</p>
          <div className="model-metrics">
            <div className="model-metric">
              <span>F1 SCORE</span>
              <strong>0.5313</strong>
            </div>
            <div className="metric-separator" />
            <div className="model-metric">
              <span>ROC–AUC</span>
              <strong>0.7671</strong>
            </div>
          </div>
          <div className="model-note">
            <span className="model-note-icon"><Icon name="insights" size={15} /></span>
            Moderate performance; use recall and context alongside the score.
          </div>
        </article>
        <article className="panel comparison-card">
          <div className="comparison-title">
            <div>
              <h3>Algorithm comparison</h3>
              <p>Metrics not reported for these rows</p>
            </div>
            <span className="comparison-badge">INCOMPLETE IN SOURCE</span>
          </div>
          <div className="comparison-table" role="table" aria-label="Reported model metrics">
            <div className="comparison-row comparison-head" role="row">
              <span role="columnheader">MODEL</span>
              <span role="columnheader">F1 SCORE</span>
              <span role="columnheader">ROC–AUC</span>
            </div>
            <div className="comparison-row" role="row">
              <span role="cell"><i className="algorithm-dot dot-blue" />Logistic Regression</span>
              <span role="cell" className="not-reported">Not reported</span>
              <span role="cell" className="not-reported">Not reported</span>
            </div>
            <div className="comparison-row" role="row">
              <span role="cell"><i className="algorithm-dot dot-gold" />Decision Tree</span>
              <span role="cell" className="not-reported">Not reported</span>
              <span role="cell" className="not-reported">Not reported</span>
            </div>
            <div className="comparison-row comparison-row-highlight" role="row">
              <span role="cell"><i className="algorithm-dot dot-green" />Random Forest</span>
              <span role="cell">0.5313</span>
              <span role="cell">0.7671</span>
            </div>
          </div>
          <div className="comparison-footnote">
            The source report’s comparison table is blank for the first two models.
          </div>
        </article>
      </div>
    </section>
  );
}

function RiskExplorer() {
  const [lateMonths, setLateMonths] = useState(0);
  const [paymentCoverage, setPaymentCoverage] = useState(65);

  const riskLevel = lateMonths >= 2 || (lateMonths >= 1 && paymentCoverage < 30)
    ? "Elevated"
    : lateMonths >= 1 || paymentCoverage < 30
      ? "Watch"
      : "Lower";
  const riskTone = riskLevel.toLowerCase();
  const riskDescription = {
    Lower: "No recent delay selected and a stronger payment-to-bill ratio.",
    Watch: "One signal suggests a closer look at recent repayment behaviour.",
    Elevated: "Recent delay and/or low payment coverage are signals to review.",
  }[riskLevel];

  return (
    <section id="explorer" className="explorer-section">
      <SectionHeading
        eyebrow="INTERACTIVE SCENARIO"
        title="Explore the risk signals."
        description="Adjust a simple customer scenario to see how the report’s findings connect."
      />
      <div className="panel explorer-panel">
        <div className="explorer-inputs">
          <div className="explorer-intro">
            <span className="explorer-icon"><Icon name="explore" size={19} /></span>
            <div>
              <h3>Customer snapshot</h3>
              <p>Choose repayment signals to explore.</p>
            </div>
          </div>
          <label className="field-label" htmlFor="late-months">Recent payment delay</label>
          <div className="select-wrap">
            <select
              id="late-months"
              value={lateMonths}
              onChange={(event) => setLateMonths(Number(event.target.value))}
            >
              <option value="0">On time</option>
              <option value="1">1 month late</option>
              <option value="2">2 months late</option>
              <option value="3">3+ months late</option>
            </select>
            <Icon name="chevron" size={15} />
          </div>
          <div className="range-label">
            <label className="field-label" htmlFor="payment-coverage">Payment vs. latest bill</label>
            <strong>{paymentCoverage}%</strong>
          </div>
          <input
            id="payment-coverage"
            className="coverage-slider"
            type="range"
            min="0"
            max="100"
            step="5"
            value={paymentCoverage}
            onChange={(event) => setPaymentCoverage(Number(event.target.value))}
            style={{ "--range-value": `${paymentCoverage}%` }}
          />
          <div className="range-ends"><span>0%</span><span>100%</span></div>
        </div>
        <div className="explorer-result">
          <div className="result-topline">
            <span>SCENARIO SIGNAL</span>
            <span className="demo-pill">DEMO ONLY</span>
          </div>
          <div className={`risk-result risk-${riskTone}`}>
            <span className="risk-indicator"><span /></span>
            <strong>{riskLevel}</strong>
          </div>
          <p className="risk-description">{riskDescription}</p>
          <div className="result-divider" />
          <p className="result-disclaimer">
            Illustrative rule-based preview — <strong>not</strong> a trained model prediction or a credit decision.
            The report does not include deployable model files or a defined risk threshold.
          </p>
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  return (
    <section id="methodology" className="methodology-section">
      <SectionHeading
        eyebrow="HOW IT WAS BUILT"
        title="From raw records to a risk signal."
        description="A reproducible, supervised-learning workflow using Python and scikit-learn."
      />
      <div className="methodology-grid">
        {preprocessingSteps.map((step, index) => (
          <article className="method-step" key={step.title}>
            <span className="step-number">0{index + 1}</span>
            <div className="step-connector" />
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>
      <div className="method-footer">
        <span className="method-footer-icon"><Icon name="users" size={17} /></span>
        <p>
          <strong>Behaviour over demographics.</strong> PAY_1 was the strongest reported feature (0.246);
          SEX, EDUCATION and MARRIAGE had very low importance in the report.
        </p>
        <a href="https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients" target="_blank" rel="noreferrer">
          Dataset source <Icon name="arrow" size={14} />
        </a>
      </div>
    </section>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(studentProfiles[1]);

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        profile={profile}
        onProfileChange={setProfile}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Research</span><Icon name="chevron" size={13} /><strong>Credit risk overview</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-status"><span /> PROJECT OVERVIEW</span>
            <a href="#methodology" className="topbar-link">About this study <Icon name="arrow" size={14} /></a>
          </div>
        </header>

        <div className="page-content">
          <section id="overview" className="overview-section">
            <div className="page-title-row">
              <div>
                <span className="eyebrow">DATA MINING · BANKING &amp; FINANCE</span>
                <h1>Credit risk overview</h1>
                <p className="page-subtitle">A closer look at the patterns behind next-month credit card default.</p>
              </div>
              <div className="report-chip"><span className="report-chip-mark">CA2</span> MINI PROJECT</div>
            </div>
            <OverviewHero />
            <div className="metric-grid">
              <MetricCard icon="users" label="CUSTOMERS" value="30,000" note="~29,965 after duplicate removal" tone="blue" />
              <MetricCard icon="clock" label="DEFAULT RATE" value="~22%" note="An imbalanced target class" tone="coral" />
              <MetricCard icon="layers" label="INPUT FEATURES" value="23" note="Plus 1 next-month target" tone="violet" />
              <MetricCard icon="model" label="BEST REPORTED AUC" value="0.7671" note="Random Forest · ROC–AUC" tone="green" />
            </div>
          </section>

          <section id="insights" className="insights-section">
            <SectionHeading
              eyebrow="THE SIGNALS"
              title="Behaviour tells the story."
              description="Payment history stands out; the other patterns offer context, not certainty."
              action={<span className="qualitative-tag"><span /> FINDINGS FROM THE REPORT</span>}
            />
            <div className="insights-grid">
              <FeatureImportance />
              <BehaviorPanel />
            </div>
            <DatasetPanel />
          </section>

          <ModelPanel />
          <RiskExplorer />
          <Methodology />

          <footer className="page-footer">
            <a className="footer-brand" href="#overview">
              <span className="brand-mark brand-mark-small"><span /><span /><span /></span>
              ledger<span>wise</span>
            </a>
            <span>Credit Card Default Prediction · Aryaman Sinha · Roll No. 28</span>
            <a href="https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients" target="_blank" rel="noreferrer">
              UCI dataset <Icon name="arrow" size={13} />
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
