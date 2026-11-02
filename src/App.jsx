import React, { useCallback, useEffect, useRef, useState } from "react";

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

const uciTemplateHeaders = [
  "LIMIT_BAL", "SEX", "EDUCATION", "MARRIAGE", "AGE",
  "PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6",
  "BILL_AMT1", "BILL_AMT2", "BILL_AMT3", "BILL_AMT4", "BILL_AMT5", "BILL_AMT6",
  "PAY_AMT1", "PAY_AMT2", "PAY_AMT3", "PAY_AMT4", "PAY_AMT5", "PAY_AMT6",
  "default.payment.next.month",
];

function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function CSVWorkflow({ job, summary, score, onFile, onDownload }) {
  const fileInput = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(
      [`${uciTemplateHeaders.join(",")}\n`],
      { type: "text/csv;charset=utf-8" },
    ));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uci-credit-default-template.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const processing = job.status === "processing" || job.status === "reading";
  return (
    <section className="csv-workspace" aria-labelledby="csv-workspace-title">
      <div className="csv-workspace-heading">
        <div>
          <span className="eyebrow">YOUR DATA · LOCAL PROCESSING</span>
          <h2 id="csv-workspace-title">Upload a credit dataset</h2>
          <p>Train and evaluate from labeled data, or score new customers with your trained model.</p>
        </div>
        <div className="csv-heading-badges">
          <span className="csv-start-badge">01 · START HERE</span>
          <span className="csv-private-badge"><span /> STAYS IN THIS BROWSER</span>
        </div>
      </div>
      <div
        className={`csv-dropzone${dragOver ? " csv-dropzone-active" : ""}${processing ? " csv-dropzone-busy" : ""}`}
        role="button"
        tabIndex={processing ? -1 : 0}
        aria-label="Choose a UCI credit default CSV file"
        aria-disabled={processing}
        onClick={(event) => {
          if (!processing && event.target !== fileInput.current) fileInput.current?.click();
        }}
        onKeyDown={(event) => {
          if (!processing && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            fileInput.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!processing) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!processing) onFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={fileInput}
          className="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose CSV file"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <span className="csv-upload-icon"><Icon name="explore" size={20} /></span>
        <span className="csv-upload-copy">
          <strong>{job.fileName || "Drop your CSV here, or browse files"}</strong>
          <small>
            {processing
              ? job.detail || "Analyzing your data…"
              : "UCI column names · labeled data trains models · unlabeled data gets scored"}
          </small>
        </span>
        <span className="csv-browse-button">{processing ? "Working…" : "Choose CSV"}</span>
      </div>
      <div className="csv-workspace-footer">
        <span className="csv-required-fields">UCI fields: LIMIT_BAL, PAY_0…PAY_6, BILL_AMT1…6, PAY_AMT1…6, and demographics</span>
        <div className="csv-download-links">
          <a className="csv-template-link" href="/sample-credit-default.csv" download>
            Download training sample
          </a>
          <a className="csv-template-link" href="/sample-credit-default-unlabeled.csv" download>
            Download scoring sample
          </a>
          <button type="button" className="csv-template-link" onClick={downloadTemplate}>CSV template</button>
        </div>
      </div>
      <div className="csv-source-note">
        Samples are 1,200 labeled and 40 unlabeled records from the CC0 Kaggle dataset.
        {" "}
        <a href="https://www.kaggle.com/datasets/uciml/default-of-credit-card-clients-dataset" target="_blank" rel="noreferrer">Dataset page <Icon name="arrow" size={11} /></a>
      </div>
      {job.status === "error" && (
        <div className="csv-alert" role="alert">
          <strong>Could not process this file.</strong>
          <span>{job.error}</span>
        </div>
      )}
      {processing && (
        <div className="csv-progress" role="status" aria-live="polite">
          <span className="csv-spinner" />
          <span>{job.detail || "Processing CSV…"}</span>
        </div>
      )}
      {job.status === "trained" && summary && (
        <div className="csv-results csv-results-training">
          <div className="csv-result-heading">
            <div>
              <span className="csv-result-kicker">TRAINING COMPLETE</span>
              <h3>{summary.rows.toLocaleString()} customer records analyzed</h3>
              <p>
                Stratified holdout evaluation · {summary.trainRows.toLocaleString()} training / {summary.testRows.toLocaleString()} test rows
                {summary.duplicatesRemoved ? ` · ${summary.duplicatesRemoved.toLocaleString()} duplicates removed` : ""}
                {summary.missingTargets ? ` · ${summary.missingTargets.toLocaleString()} unlabeled rows skipped` : ""}
              </p>
            </div>
            <span className="csv-target-badge">DEFAULT · {formatPercent(summary.defaultRate)} positive</span>
          </div>
          <div className="csv-metrics-wrap">
            <table className="csv-metrics-table">
              <thead>
                <tr><th>MODEL</th><th>ACCURACY</th><th>PRECISION</th><th>RECALL</th><th>F1</th><th>ROC–AUC</th></tr>
              </thead>
              <tbody>
                {summary.metrics.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row">{metric.name}</th>
                    <td>{formatPercent(metric.accuracy)}</td>
                    <td>{formatPercent(metric.precision)}</td>
                    <td>{formatPercent(metric.recall)}</td>
                    <td>{formatPercent(metric.f1)}</td>
                    <td>{metric.rocAuc.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="csv-preprocess-summary">
            <span><strong>{summary.imputedCells.toLocaleString()}</strong> missing feature values imputed</span>
            <span><strong>{summary.features}</strong> encoded features retained after correlation filtering</span>
            <span><strong>{summary.duplicatesRemoved.toLocaleString()}</strong> duplicate rows removed</span>
          </div>
          <div className="csv-confusion">
            <strong>Random Forest confusion matrix · held-out rows</strong>
            <span><b>True positive</b> {summary.metrics.find((metric) => metric.key === "forest").confusion.truePositive}</span>
            <span><b>False negative</b> {summary.metrics.find((metric) => metric.key === "forest").confusion.falseNegative}</span>
            <span><b>False positive</b> {summary.metrics.find((metric) => metric.key === "forest").confusion.falsePositive}</span>
            <span><b>True negative</b> {summary.metrics.find((metric) => metric.key === "forest").confusion.trueNegative}</span>
          </div>
          <div className="csv-results-footnote">
            <Icon name="model" size={14} />
            Evaluated on held-out test rows. Threshold metrics use 0.50; AUC uses model scores.
          </div>
        </div>
      )}
      {job.status === "scored" && score && (
        <div className="csv-results csv-results-scoring">
          <div className="csv-result-heading">
            <div>
              <span className="csv-result-kicker">SCORING COMPLETE</span>
              <h3>{score.rows.toLocaleString()} new customer rows scored</h3>
              <p>Scored with the Random Forest trained from your labeled CSV in this browser session.</p>
            </div>
            <button type="button" className="csv-download-button" onClick={onDownload}>
              Download scores <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="score-summary">
            <span><strong>{score.high.toLocaleString()}</strong> high signal</span>
            <span><strong>{score.moderate.toLocaleString()}</strong> moderate signal</span>
            <span><strong>{score.lower.toLocaleString()}</strong> lower signal</span>
            <span><strong>{formatPercent(score.averageScore)}</strong> average score</span>
          </div>
          <div className="csv-metrics-wrap">
            <table className="csv-metrics-table score-table">
              <thead>
                <tr>
                  <th>CSV ROW</th>
                  {score.preview.some((row) => row.customer_id) && <th>CUSTOMER ID</th>}
                  <th>DEFAULT RISK SCORE</th>
                  <th>RISK BAND</th>
                </tr>
              </thead>
              <tbody>
                {score.preview.map((row) => (
                  <tr key={row.source_row}>
                    <th scope="row">{row.source_row}</th>
                    {score.preview.some((item) => item.customer_id) && <td>{row.customer_id || "—"}</td>}
                    <td>{formatPercent(row.default_risk_score, 2)}</td>
                    <td><span className={`score-band score-band-${row.risk_band.toLowerCase()}`}>{row.risk_band}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="csv-results-footnote">
            Illustrative bands: lower &lt;35%, moderate 35–64%, high ≥65%. Scores are model outputs for review, not calibrated probabilities or credit decisions.
          </div>
        </div>
      )}
      {summary && job.status !== "trained" && (
        <div className="csv-model-ready">
          <span className="csv-ready-dot" />
          Trained model ready for scoring new, unlabeled UCI-format CSV files.
        </div>
      )}
    </section>
  );
}

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
    <article className={`metric-card metric-card-${tone}`}>
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

function OverviewHero({ summary }) {
  const forestMetrics = summary?.metrics.find((metric) => metric.key === "forest");

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
            <strong>{forestMetrics ? forestMetrics.rocAuc.toFixed(2) : "0.77"}</strong>
            <small>Random Forest</small>
          </div>
        </div>
        <span className="orbit-label orbit-label-top">BEHAVIOUR</span>
        <span className="orbit-label orbit-label-bottom">PREDICTIVE SIGNAL</span>
        <span className="hero-spark spark-one" />
        <span className="hero-spark spark-two" />
      </div>
      <div className="hero-footer">
        <span className="dataset-source"><span className="source-dot" /> {summary ? "UPLOADED UCI-FORMAT CSV" : "UCI CREDIT CARD DEFAULT DATASET"}</span>
        <span className="hero-footer-divider" />
        <span>Banking &amp; finance</span>
        <span className="hero-footer-right">A research overview <Icon name="arrow" size={13} /></span>
      </div>
    </section>
  );
}

function FeatureImportance({ liveFeatures }) {
  const displayFeatures = liveFeatures || features.map(({ name, value }) => ({ name, importance: value }));
  const maxImportance = Math.max(...displayFeatures.map((feature) => feature.importance), 0.0001);
  const featureDescription = (name) => {
    if (name.startsWith("PAY_")) return `Repayment status · month ${name.slice(4)}`;
    if (name.startsWith("PAY_AMT")) return `Payment amount · month ${name.slice(7)}`;
    if (name.startsWith("BILL_AMT")) return `Bill amount · month ${name.slice(8)}`;
    if (name.startsWith("EDUCATION_")) return `Education category ${name.slice(10)}`;
    if (name.startsWith("MARRIAGE_")) return `Marriage category ${name.slice(9)}`;
    if (name.startsWith("SEX_")) return `Sex category ${name.slice(4)}`;
    if (name === "LIMIT_BAL") return "Customer credit limit";
    if (name === "AGE") return "Customer age";
    return "Model feature";
  };

  return (
    <article className="panel feature-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WHAT THE MODEL LEARNED</span>
          <h3>Repayment history leads</h3>
          <p>{liveFeatures ? "Measured on the uploaded training data" : "Top feature importance · Random Forest"}</p>
        </div>
        <span className="panel-icon"><Icon name="insights" size={18} /></span>
      </div>
      <div className="feature-list">
        {displayFeatures.slice(0, 5).map((feature, index) => (
          <div className="feature-row" key={feature.name}>
            <div className="feature-label">
              <span className={`feature-rank${index === 0 ? " feature-rank-first" : ""}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="feature-name-wrap">
                <strong>{feature.name}</strong>
                <small>{feature.detail || featureDescription(feature.name)}</small>
              </span>
              <span className="feature-value">{feature.importance.toFixed(3)}</span>
            </div>
            <div className="feature-track">
              <span style={{ width: `${(feature.importance / maxImportance) * 100}%` }} />
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

function BehaviorPanel({ delayRates }) {
  const actualRates = delayRates?.filter((item) => item.count > 0) || [];
  const maxRate = Math.max(...actualRates.map((item) => item.defaultRate), 0.01);
  const categories = delayRates || [
    { label: "On time / early", count: 0, defaultRate: null },
    { label: "1 month late", count: 0, defaultRate: null },
    { label: "2+ months late", count: 0, defaultRate: null },
  ];

  return (
    <article className="panel behavior-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">BEHAVIOUR SIGNAL</span>
          <h3>Delays change the picture</h3>
          <p>{delayRates ? "Observed default rate by most recent repayment status." : "Default likelihood rises with repayment delay."}</p>
        </div>
        <span className="panel-icon panel-icon-coral"><Icon name="clock" size={18} /></span>
      </div>
      <div className="behavior-visual" aria-label={delayRates ? "Default rates by most recent repayment status from the uploaded dataset" : "Qualitative illustration of increasing risk with repayment delay"}>
        <div className="behavior-axis">
          <span>{delayRates ? "DEFAULT RATE" : "LOWER"}</span>
          <span>{delayRates ? "BY PAYMENT DELAY" : "HIGHER RISK"}</span>
        </div>
        <div className="behavior-bars">
          {categories.map((category, index) => (
            <div className="behavior-column" key={category.label}>
              <div
                className={`behavior-bar behavior-bar-${["one", "two", "three"][index]}`}
                style={delayRates
                  ? { height: category.defaultRate === null ? "4%" : `${Math.max(4, (category.defaultRate / maxRate) * 86)}%` }
                  : undefined}
              >
                {delayRates && category.defaultRate !== null
                  ? <small>{formatPercent(category.defaultRate, 0)}</small>
                  : !delayRates && <span />}
              </div>
              <span className="behavior-category">
                {delayRates ? category.label.replace(" / early", "") : ["On time", "1 month late", "2+ months late"][index]}
              </span>
            </div>
          ))}
        </div>
        <div className="behavior-annotation">
          <span className="annotation-line" />
          <span>
            {delayRates
              ? `Counts: ${categories.map(({ count }) => count.toLocaleString()).join(" · ")}`
              : "Direction shown, not to scale"}
          </span>
        </div>
      </div>
      <div className="behavior-callout">
        <span className="callout-indicator" />
        <p>
          <strong>{delayRates ? "Observed in your data." : "Early intervention matters."}</strong>{" "}
          {delayRates
            ? "Rates are calculated from uploaded labeled rows; groups with no records are omitted from the calculation."
            : "The report identifies recent repayment status as the clearest pattern in the dataset."}
        </p>
      </div>
    </article>
  );
}

function DatasetPanel({ summary }) {
  const defaultRate = summary?.defaultRate ?? 0.22;

  return (
    <article className="panel dataset-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">THE DATA</span>
          <h3>A substantial signal, an uneven split</h3>
          <p>{summary ? "Uploaded dataset · analyzed in this browser" : "Default of Credit Card Clients · Taiwan, 2005"}</p>
        </div>
        <span className="panel-icon panel-icon-violet"><Icon name="users" size={18} /></span>
      </div>
      <div className="class-distribution">
        <div className="distribution-copy">
          <strong>{summary ? `${summary.defaults.toLocaleString()} customers defaulted.` : "Most customers repaid."}</strong>
          <span>{summary ? "Class distribution from labeled, deduplicated upload rows." : "Default is the minority outcome, so accuracy alone can be misleading."}</span>
        </div>
        <div className="distribution-value">
          <strong>{formatPercent(defaultRate, 0)}</strong>
          <small>DEFAULTED</small>
        </div>
      </div>
      <div className="distribution-track" role="img" aria-label={`${formatPercent(defaultRate)} defaulted and ${formatPercent(1 - defaultRate)} did not`}>
        <span className="distribution-default" style={{ width: `${defaultRate * 100}%` }} />
        <span className="distribution-no-default" />
      </div>
      <div className="distribution-legend">
        <span><i className="legend-dot legend-default" /> Defaulted <strong>{formatPercent(defaultRate)}</strong></span>
        <span><i className="legend-dot legend-no-default" /> No default <strong>{formatPercent(1 - defaultRate)}</strong></span>
      </div>
      <div className="dataset-meta">
        <span><strong>{summary ? summary.rows.toLocaleString() : "30,000"}</strong> {summary ? "unique rows" : "original records"}</span>
        <span><strong>{summary ? summary.features : "23"} + target</strong> columns</span>
        <span><strong>{summary ? "80 / 20" : "80 / 20"}</strong> train / test split</span>
      </div>
    </article>
  );
}

function ModelPanel({ summary }) {
  const forestMetrics = summary?.metrics.find((metric) => metric.key === "forest");

  return (
    <section id="model" className="model-section">
      <SectionHeading
        eyebrow="MODEL PERFORMANCE"
        title="A useful signal, not a crystal ball."
        description={summary
          ? "Three classifiers trained from the uploaded file and evaluated on stratified holdout rows."
          : "The report compares three classifiers. Only the Random Forest summary metrics are filled in."}
      />
      <div className="model-layout">
        <article className="panel model-card model-card-featured">
          <div className="model-card-top">
            <div className="model-icon"><Icon name="layers" size={19} /></div>
            <span className="model-status"><span /> {summary ? "TRAINED ON YOUR DATA" : "BEST REPORTED MODEL"}</span>
          </div>
          <h3>Random Forest</h3>
          <p>{summary ? "60 balanced bootstrap trees · max depth 8" : "200 trees · max depth 10 · balanced class weights"}</p>
          <div className="model-metrics">
            <div className="model-metric">
              <span>F1 SCORE</span>
              <strong>{forestMetrics ? forestMetrics.f1.toFixed(4) : "0.5313"}</strong>
            </div>
            <div className="metric-separator" />
            <div className="model-metric">
              <span>ROC–AUC</span>
              <strong>{forestMetrics ? forestMetrics.rocAuc.toFixed(4) : "0.7671"}</strong>
            </div>
          </div>
          <div className="model-note">
            <span className="model-note-icon"><Icon name="insights" size={15} /></span>
            {summary
              ? `Precision ${formatPercent(forestMetrics.precision)} · Recall ${formatPercent(forestMetrics.recall)} on held-out rows.`
              : "Moderate performance; use recall and context alongside the score."}
          </div>
        </article>
        <article className="panel comparison-card">
          <div className="comparison-title">
            <div>
              <h3>Algorithm comparison</h3>
              <p>{summary ? "Measured on the uploaded dataset" : "Metrics not reported for these rows"}</p>
            </div>
            <span className="comparison-badge">{summary ? "HOLDOUT RESULTS" : "INCOMPLETE IN SOURCE"}</span>
          </div>
          <div className="comparison-table" role="table" aria-label="Reported model metrics">
            <div className="comparison-row comparison-head" role="row">
              <span role="columnheader">MODEL</span>
              <span role="columnheader">F1 SCORE</span>
              <span role="columnheader">ROC–AUC</span>
            </div>
            {(summary?.metrics || [
              { name: "Logistic Regression", key: "logistic", f1: null, rocAuc: null },
              { name: "Decision Tree", key: "tree", f1: null, rocAuc: null },
              { name: "Random Forest", key: "forest", f1: 0.5313, rocAuc: 0.7671 },
            ]).map((metric) => (
              <div
                className={`comparison-row${metric.key === "forest" ? " comparison-row-highlight" : ""}`}
                role="row"
                key={metric.key}
              >
                <span role="cell">
                  <i className={`algorithm-dot ${metric.key === "logistic" ? "dot-blue" : metric.key === "tree" ? "dot-gold" : "dot-green"}`} />
                  {metric.name}
                </span>
                <span role="cell" className={metric.f1 === null ? "not-reported" : ""}>
                  {metric.f1 === null ? "Not reported" : metric.f1.toFixed(3)}
                </span>
                <span role="cell" className={metric.rocAuc === null ? "not-reported" : ""}>
                  {metric.rocAuc === null ? "Not reported" : metric.rocAuc.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="comparison-footnote">
            {summary
              ? "Precision and recall are available in the uploaded dataset results above."
              : "The source report’s comparison table is blank for the first two models."}
          </div>
        </article>
      </div>
    </section>
  );
}

function RiskExplorer({ summary, modelScenario, onScenario }) {
  const [lateMonths, setLateMonths] = useState(0);
  const [paymentCoverage, setPaymentCoverage] = useState(65);
  useEffect(() => {
    if (summary) onScenario(lateMonths, paymentCoverage);
  }, [summary, lateMonths, paymentCoverage, onScenario]);

  const demoRisk = lateMonths >= 2 || (lateMonths >= 1 && paymentCoverage < 30)
    ? "Elevated"
    : lateMonths >= 1 || paymentCoverage < 30
      ? "Watch"
      : "Lower";
  const riskLevel = summary
    ? modelScenario?.pending ? "Scoring…" : modelScenario?.error ? "Unavailable" : modelScenario?.result?.band || "Scoring…"
    : demoRisk;
  const riskTone = summary
    ? modelScenario?.result?.band === "High" ? "elevated"
      : modelScenario?.result?.band === "Moderate" ? "watch"
        : "lower"
    : demoRisk.toLowerCase();
  const riskDescription = {
    Lower: "The trained Random Forest assigns a lower score to this median-profile scenario.",
    Moderate: "The trained Random Forest assigns a moderate score to this median-profile scenario.",
    High: "The trained Random Forest assigns a higher score to this median-profile scenario.",
    "Scoring…": "Applying the trained model to the selected repayment scenario.",
    Unavailable: modelScenario?.error || "The scenario could not be calculated.",
    Watch: "One signal suggests a closer look at recent repayment behaviour.",
    Elevated: "Recent delay and/or low payment coverage are signals to review.",
  }[riskLevel];

  return (
    <section id="explorer" className="explorer-section">
      <SectionHeading
        eyebrow="INTERACTIVE SCENARIO"
        title="Explore the risk signals."
        description={summary
          ? "Adjust repayment signals to test the trained Random Forest."
          : "Adjust a simple customer scenario to see how the report’s findings connect."}
      />
      <div className="panel explorer-panel">
        <div className="explorer-inputs">
          <div className="explorer-intro">
            <span className="explorer-icon"><Icon name="explore" size={19} /></span>
            <div>
              <h3>Customer snapshot</h3>
              <p>{summary ? "Other customer attributes use training medians." : "Choose repayment signals to explore."}</p>
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
            <span>{summary ? "MODEL SCENARIO" : "SCENARIO SIGNAL"}</span>
            <span className="demo-pill">{summary ? "TRAINED MODEL" : "DEMO ONLY"}</span>
          </div>
          <div className={`risk-result risk-${riskTone}`}>
            <span className="risk-indicator"><span /></span>
            <strong>{riskLevel}</strong>
          </div>
          <p className="risk-description">{modelScenario?.error || riskDescription}</p>
          {summary && modelScenario?.result && (
            <div className="scenario-score-value">
              <span>MODEL SCORE</span>
              <strong>{formatPercent(modelScenario.result.score, 1)}</strong>
            </div>
          )}
          <div className="result-divider" />
          <p className="result-disclaimer">
            {summary
              ? "Scenario uses median values for all other customer attributes. Model score and illustrative band are not calibrated probabilities or a credit decision."
              : <>Illustrative rule-based preview — <strong>not</strong> a trained model prediction or a credit decision. Upload labeled data to train an in-browser model.</>}
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
  const [job, setJob] = useState({ status: "idle", fileName: "", detail: "" });
  const [summary, setSummary] = useState(null);
  const [score, setScore] = useState(null);
  const [modelScenario, setModelScenario] = useState(null);
  const workerRef = useRef(null);
  const activeJobId = useRef(0);
  const activeScenarioId = useRef(0);

  useEffect(() => {
    let worker;
    try {
      worker = new Worker(new URL("./credit.worker.js", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event) => {
        const message = event.data;
        if (message.type === "scenario" || message.type === "scenarioError") {
          if (message.id !== activeScenarioId.current) return;
          setModelScenario(message.type === "scenario"
            ? { result: message.result }
            : { error: message.message });
          return;
        }
        if (message.id !== activeJobId.current) return;
        if (message.type === "progress") {
          setJob((current) => ({ ...current, status: "processing", detail: message.progress.detail }));
        } else if (message.type === "trained") {
          setSummary(message.summary);
          setScore(null);
          setModelScenario(null);
          setJob((current) => ({ ...current, status: "trained", detail: "" }));
        } else if (message.type === "scored") {
          setScore(message.score);
          setJob((current) => ({ ...current, status: "scored", detail: "" }));
        } else if (message.type === "error") {
          setJob((current) => ({ ...current, status: "error", error: message.message, detail: "" }));
        }
      };
      worker.onerror = (event) => {
        setJob((current) => ({
          ...current,
          status: "error",
          error: event.message || "The analysis worker stopped unexpectedly. Try the file again.",
          detail: "",
        }));
      };
    } catch (error) {
      if (id !== activeJobId.current) return;
      setJob({
        status: "error",
        fileName: "",
        error: error instanceof Error ? error.message : "This browser could not start the analysis worker.",
      });
    }

    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleCsvFile = async (file) => {
    if (!file) return;
    const id = activeJobId.current + 1;
    activeJobId.current = id;
    if (!/\.csv$/i.test(file.name)) {
      setJob({ status: "error", fileName: file.name, error: "Choose a .csv file.", detail: "" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setJob({ status: "error", fileName: file.name, error: "This browser version supports CSV files up to 50 MB.", detail: "" });
      return;
    }
    if (!workerRef.current) {
      setJob({
        status: "error",
        fileName: file.name,
        error: "The analysis worker is unavailable. Refresh the page and try again.",
        detail: "",
      });
      return;
    }

    setJob({ status: "reading", fileName: file.name, detail: "Reading file locally…" });
    try {
      const text = await file.text();
      if (id !== activeJobId.current) return;
      setJob({ status: "processing", fileName: file.name, detail: "Validating UCI columns…" });
      workerRef.current.postMessage({ id, text });
    } catch (error) {
      setJob({
        status: "error",
        fileName: file.name,
        error: error instanceof Error ? error.message : "Could not read the selected CSV file.",
        detail: "",
      });
    }
  };

  const downloadScores = () => {
    if (!score?.csv) return;
    const url = URL.createObjectURL(new Blob([score.csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "credit-default-risk-scores.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const requestScenario = useCallback((lateMonths, paymentCoverage) => {
    if (!workerRef.current || !summary) return;
    const id = activeScenarioId.current + 1;
    activeScenarioId.current = id;
    setModelScenario({ pending: true });
    workerRef.current.postMessage({
      action: "scenario",
      id,
      lateMonths,
      paymentCoverage,
    });
  }, [summary]);

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
            <OverviewHero summary={summary} />
            <div className="metric-grid">
              <MetricCard
                icon="users"
                label="CUSTOMERS"
                value={summary ? summary.rows.toLocaleString() : "30,000"}
                note={summary ? `${summary.duplicatesRemoved.toLocaleString()} duplicates removed` : "~29,965 after duplicate removal"}
                tone="blue"
              />
              <MetricCard
                icon="clock"
                label="DEFAULT RATE"
                value={summary ? formatPercent(summary.defaultRate, 0) : "~22%"}
                note={summary ? `${summary.defaults.toLocaleString()} labeled defaults` : "An imbalanced target class"}
                tone="coral"
              />
              <MetricCard
                icon="layers"
                label="INPUT FEATURES"
                value={summary ? String(summary.features) : "23"}
                note={summary ? "After category encoding and correlation filtering" : "Plus 1 next-month target"}
                tone="violet"
              />
              <MetricCard
                icon="model"
                label={summary ? "UPLOAD ROC–AUC" : "BEST REPORTED AUC"}
                value={summary ? summary.metrics.find((metric) => metric.key === "forest").rocAuc.toFixed(3) : "0.7671"}
                note={summary ? "Random Forest · held-out rows" : "Random Forest · ROC–AUC"}
                tone="green"
              />
            </div>
          </section>

          <CSVWorkflow
            job={job}
            summary={summary}
            score={score}
            onFile={handleCsvFile}
            onDownload={downloadScores}
          />

          <section id="insights" className="insights-section">
            <SectionHeading
              eyebrow="THE SIGNALS"
              title="Behaviour tells the story."
              description={summary
                ? "Live feature importance and default rates computed from your labeled upload."
                : "Payment history stands out; the other patterns offer context, not certainty."}
              action={<span className="qualitative-tag"><span /> {summary ? "LIVE DATA" : "FINDINGS FROM THE REPORT"}</span>}
            />
            <div className="insights-grid">
              <FeatureImportance liveFeatures={summary?.topFeatures} />
              <BehaviorPanel delayRates={summary?.delayRates} />
            </div>
            <DatasetPanel summary={summary} />
          </section>

          <ModelPanel summary={summary} />
          <RiskExplorer
            summary={summary}
            modelScenario={modelScenario}
            onScenario={requestScenario}
          />
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
