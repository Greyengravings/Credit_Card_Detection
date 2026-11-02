import assert from "node:assert/strict";
import test from "node:test";
import { analyzeAndTrain, scoreCsv, scoreScenario } from "./creditAnalysis.js";

const headers = [
  "LIMIT_BAL", "SEX", "EDUCATION", "MARRIAGE", "AGE",
  "PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6",
  "BILL_AMT1", "BILL_AMT2", "BILL_AMT3", "BILL_AMT4", "BILL_AMT5", "BILL_AMT6",
  "PAY_AMT1", "PAY_AMT2", "PAY_AMT3", "PAY_AMT4", "PAY_AMT5", "PAY_AMT6",
  "default.payment.next.month",
];

function makeRow(index, target) {
  return [
    20_000 + (index % 80) * 5_000,
    1 + (index % 2),
    index % 8 === 0 ? 0 : 1 + (index % 4),
    index % 5,
    21 + (index % 48),
    target ? 1 + (index % 3) : 0,
    target ? 1 : 0,
    index % 3 - 1,
    0,
    -1,
    0,
    1000 + index * 31,
    900 + index * 29,
    800 + index * 27,
    700 + index * 23,
    600 + index * 19,
    500 + index * 17,
    100 + index * 7,
    90 + index * 5,
    80 + index * 3,
    70 + index * 2,
    60 + index,
    50 + index,
    target,
  ];
}

function labeledCsv(size = 100) {
  const rows = Array.from({ length: size }, (_, index) => makeRow(index, index % 2));
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

test("labeled UCI CSV trains three models and returns held-out metrics", async () => {
  const result = await analyzeAndTrain(labeledCsv());

  assert.equal(result.kind, "trained");
  assert.equal(result.summary.rows, 100);
  assert.equal(result.summary.trainRows + result.summary.testRows, 100);
  assert.deepEqual(result.summary.metrics.map((metric) => metric.key), ["logistic", "tree", "forest"]);
  for (const metric of result.summary.metrics) {
    assert.ok(metric.accuracy >= 0 && metric.accuracy <= 1);
    assert.ok(metric.precision >= 0 && metric.precision <= 1);
    assert.ok(metric.recall >= 0 && metric.recall <= 1);
    assert.ok(metric.f1 >= 0 && metric.f1 <= 1);
    assert.ok(metric.rocAuc >= 0 && metric.rocAuc <= 1);
    assert.equal(
      metric.confusion.truePositive + metric.confusion.falsePositive
        + metric.confusion.falseNegative + metric.confusion.trueNegative,
      result.summary.testRows,
    );
  }
  assert.ok(result.summary.topFeatures.length > 0);
  assert.ok(result.summary.delayRates.some((group) => group.count > 0));
});

test("preprocessing imputes missing feature values and removes duplicates", async () => {
  const rows = labeledCsv().split("\n");
  const firstDataRow = rows[1].split(",");
  firstDataRow[11] = "";
  rows[1] = firstDataRow.join(",");
  rows.push(rows[2]);
  const result = await analyzeAndTrain(rows.join("\n"));

  assert.equal(result.summary.rows, 100);
  assert.equal(result.summary.duplicatesRemoved, 1);
  assert.ok(result.summary.imputedCells > 0);
  assert.ok(result.summary.features > 0);
});

test("scoring accepts unlabeled rows and returns downloadable CSV results", async () => {
  const trained = await analyzeAndTrain(labeledCsv());
  const header = headers.slice(0, -1).join(",");
  const customer = makeRow(150, 0).slice(0, -1).join(",");
  const scored = scoreCsv(`${header}\n${customer}\n${customer}`, trained.summary.model);

  assert.equal(scored.rows, 2);
  assert.equal(scored.duplicatesRemoved, 0);
  assert.ok(scored.preview[0].default_risk_score >= 0);
  assert.ok(scored.preview[0].default_risk_score <= 1);
  assert.match(scored.csv, /default_risk_score,risk_band/);
});

test("Kaggle sample CSVs train, score, and preserve customer IDs", async () => {
  const { readFile } = await import("node:fs/promises");
  const labeled = await readFile(new URL("../public/sample-credit-default.csv", import.meta.url), "utf8");
  const unlabeled = await readFile(new URL("../public/sample-credit-default-unlabeled.csv", import.meta.url), "utf8");
  const trained = await analyzeAndTrain(labeled);
  const scored = scoreCsv(unlabeled, trained.summary.model);

  assert.equal(trained.summary.rows, 1200);
  assert.equal(trained.summary.defaults, 264);
  assert.equal(scored.rows, 40);
  assert.ok(scored.preview[0].customer_id);
  assert.match(scored.csv, /customer_id/);
});

test("blank target columns are treated as unlabeled rows for scoring", async () => {
  const trained = await analyzeAndTrain(labeledCsv());
  const customer = makeRow(151, 0);
  customer[customer.length - 1] = "";
  const scored = scoreCsv(`${headers.join(",")}\n${customer.join(",")}`, trained.summary.model);

  assert.equal(scored.rows, 1);
});

test("risk explorer scenarios return a score from the uploaded model", async () => {
  const trained = await analyzeAndTrain(labeledCsv());
  const scenario = scoreScenario(2, 20, trained.summary.model);

  assert.ok(scenario.score >= 0);
  assert.ok(scenario.score <= 1);
  assert.ok(["Lower", "Moderate", "High"].includes(scenario.band));
});

test("invalid schemas and target values return actionable errors", async () => {
  await assert.rejects(
    analyzeAndTrain("name,age,default\nAlice,35,0"),
    /Missing required UCI columns/,
  );
  const invalidFeature = labeledCsv().replace("20000,1,0,0,21", "twenty-thousand,1,0,0,21");
  await assert.rejects(analyzeAndTrain(invalidFeature), /Expected a numeric value for LIMIT_BAL/);
  const invalidTarget = labeledCsv().replace(/,0\n/, ",2\n");
  await assert.rejects(analyzeAndTrain(invalidTarget), /Target values must be 0 or 1/);
});
