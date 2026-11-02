import { analyzeAndTrain, scoreCsv, scoreScenario } from "./creditAnalysis.js";

let activeModel = null;

self.onmessage = async (event) => {
  const { id, text, action } = event.data;
  try {
    if (action === "scenario") {
      if (!activeModel) throw new Error("Train a model from labeled customer data before exploring model scores.");
      self.postMessage({
        id,
        type: "scenario",
        result: scoreScenario(event.data.lateMonths, event.data.paymentCoverage, activeModel),
      });
      return;
    }

    const result = await analyzeAndTrain(text, (progress) => {
      self.postMessage({ id, type: "progress", progress });
    });

    if (result.kind === "score") {
      if (!activeModel) {
        throw new Error("Upload a labeled UCI CSV containing DEFAULT first so the app can train a model before scoring new customer rows.");
      }
      const score = scoreCsv(text, activeModel);
      self.postMessage({ id, type: "scored", score });
      return;
    }

    activeModel = result.summary.model;
    const { model, ...summary } = result.summary;
    self.postMessage({ id, type: "trained", summary });
  } catch (error) {
    self.postMessage({
      id,
      type: action === "scenario" ? "scenarioError" : "error",
      message: error instanceof Error ? error.message : "The CSV could not be processed.",
    });
  }
};
