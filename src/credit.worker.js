import { analyzeAndTrain, scoreCsv } from "./creditAnalysis.js";

let activeModel = null;

self.onmessage = async (event) => {
  const { id, text } = event.data;
  try {
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
      type: "error",
      message: error instanceof Error ? error.message : "The CSV could not be processed.",
    });
  }
};
