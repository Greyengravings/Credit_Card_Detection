import Papa from "papaparse";

const FEATURE_COLUMNS = [
  "LIMIT_BAL",
  "SEX",
  "EDUCATION",
  "MARRIAGE",
  "AGE",
  "PAY_1",
  "PAY_2",
  "PAY_3",
  "PAY_4",
  "PAY_5",
  "PAY_6",
  "BILL_AMT1",
  "BILL_AMT2",
  "BILL_AMT3",
  "BILL_AMT4",
  "BILL_AMT5",
  "BILL_AMT6",
  "PAY_AMT1",
  "PAY_AMT2",
  "PAY_AMT3",
  "PAY_AMT4",
  "PAY_AMT5",
  "PAY_AMT6",
];
const CATEGORICAL_COLUMNS = new Set(["SEX", "EDUCATION", "MARRIAGE"]);
const WINSORIZED_COLUMNS = new Set([
  "LIMIT_BAL",
  "BILL_AMT1",
  "BILL_AMT2",
  "BILL_AMT3",
  "BILL_AMT4",
  "BILL_AMT5",
  "BILL_AMT6",
  "PAY_AMT1",
  "PAY_AMT2",
  "PAY_AMT3",
  "PAY_AMT4",
  "PAY_AMT5",
  "PAY_AMT6",
]);
const TARGET_COLUMNS = new Set([
  "DEFAULT",
  "DEFAULT_PAYMENT_NEXT_MONTH",
  "DEFAULTPAYMENTNEXTMONTH",
]);
const MAX_ROWS = 100_000;

function canonicalHeader(value) {
  const header = String(value)
    .replace(/^\uFEFF/, "")
    .trim()
    .toUpperCase()
    .replace(/[\s./-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (header === "PAY_0") return "PAY_1";
  if (header === "DEFAULT_PAYMENT_NEXT_MONTH") return "DEFAULT";
  return header;
}

function parseCsv(text) {
  if (!text.trim()) throw new Error("The selected CSV file is empty.");
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: canonicalHeader,
  });
  const fatalError = parsed.errors.find((error) => error.code !== "TooFewFields");
  if (fatalError) {
    throw new Error(`Could not read the CSV near row ${fatalError.row + 1}: ${fatalError.message}`);
  }
  if (!parsed.meta.fields?.length) {
    throw new Error("The CSV needs a header row with UCI credit default column names.");
  }
  if (parsed.data.length > MAX_ROWS) {
    throw new Error(`This browser version supports up to ${MAX_ROWS.toLocaleString()} rows per CSV.`);
  }
  const headers = parsed.meta.fields.map(canonicalHeader);
  const missing = FEATURE_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(`Missing required UCI columns: ${missing.join(", ")}. Rename the headers to match the UCI credit default dataset.`);
  }
  const targetColumn = headers.find((header) => TARGET_COLUMNS.has(header));

  const rows = [];
  let missingTargets = 0;
  for (let index = 0; index < parsed.data.length; index += 1) {
    const record = parsed.data[index];
    const values = FEATURE_COLUMNS.map((column) => parseNumber(record[column]));
    let target;
    if (targetColumn) {
      const rawTarget = parseNumber(record[targetColumn]);
      if (!Number.isFinite(rawTarget)) {
        missingTargets += 1;
        continue;
      }
      if (rawTarget !== 0 && rawTarget !== 1) {
        throw new Error(`Target values must be 0 or 1. Found "${record[targetColumn]}" on CSV row ${index + 2}.`);
      }
      target = rawTarget;
    }

    cleanCategoryValues(values);
    rows.push({ values, target, sourceRow: index + 2 });
  }

  if (!rows.length) throw new Error("No usable customer rows were found in the CSV.");
  return { rows, headers, targetColumn: targetColumn || null, missingTargets };
}

function parseNumber(value) {
  if (value === undefined || value === null || String(value).trim() === "") return NaN;
  const normalized = String(value).trim();
  if (/^(NA|N\/A|NULL|\?)$/i.test(normalized)) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function cleanCategoryValues(values) {
  for (const column of ["EDUCATION", "MARRIAGE"]) {
    const index = FEATURE_COLUMNS.indexOf(column);
    if (!Number.isFinite(values[index])) continue;
    if (column === "EDUCATION" && [0, 5, 6].includes(values[index])) values[index] = 4;
    if (column === "MARRIAGE" && values[index] === 0) values[index] = 3;
  }
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function stratifiedSplit(rows) {
  const random = seededRandom(42);
  const byClass = [[], []];
  rows.forEach((row, index) => byClass[row.target].push(index));
  if (byClass.some((indices) => indices.length < 2)) {
    throw new Error("At least two examples of each target class are needed for a stratified train/test split.");
  }

  const trainIndices = [];
  const testIndices = [];
  byClass.forEach((indices) => {
    const ordered = shuffled(indices, random);
    const testCount = Math.min(ordered.length - 1, Math.max(1, Math.round(ordered.length * 0.2)));
    testIndices.push(...ordered.slice(0, testCount));
    trainIndices.push(...ordered.slice(testCount));
  });
  return { trainIndices, testIndices };
}

function quantile(values, fraction) {
  const ordered = values.slice().sort((a, b) => a - b);
  const position = (ordered.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return ordered[lower];
  return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower);
}

function median(values) {
  return quantile(values, 0.5);
}

function fitPreprocessor(trainRows) {
  const medians = {};
  const bounds = {};
  const categoryValues = {};
  let imputedCells = 0;

  FEATURE_COLUMNS.forEach((column, columnIndex) => {
    const values = trainRows.map((row) => row.values[columnIndex]).filter(Number.isFinite);
    if (!values.length) {
      throw new Error(`Column ${column} has no numeric values in the training rows.`);
    }

    if (CATEGORICAL_COLUMNS.has(column)) {
      const frequencies = new Map();
      values.forEach((value) => frequencies.set(value, (frequencies.get(value) || 0) + 1));
      const mode = [...frequencies.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
      medians[column] = mode;
      categoryValues[column] = [...frequencies.keys()].sort((a, b) => a - b);
    } else {
      medians[column] = median(values);
      if (WINSORIZED_COLUMNS.has(column)) {
        bounds[column] = [quantile(values, 0.01), quantile(values, 0.99)];
      }
    }

    for (const row of trainRows) {
      if (!Number.isFinite(row.values[columnIndex])) imputedCells += 1;
    }
  });

  const featureNames = [];
  FEATURE_COLUMNS.forEach((column) => {
    if (CATEGORICAL_COLUMNS.has(column)) {
      categoryValues[column].slice(1).forEach((value) => featureNames.push(`${column}_${value}`));
    } else {
      featureNames.push(column);
    }
  });

  const preprocessor = { medians, bounds, categoryValues, featureNames, selectedFeatureIndices: [] };
  const trainMatrix = trainRows.map((row) => transformRow(row, preprocessor, false));
  const selectedFeatureIndices = selectUncorrelatedFeatures(trainMatrix);
  preprocessor.selectedFeatureIndices = selectedFeatureIndices;
  preprocessor.featureNames = selectedFeatureIndices.map((index) => preprocessor.featureNames[index]);

  return {
    preprocessor,
    trainMatrix: trainMatrix.map((row) => selectedFeatureIndices.map((index) => row[index])),
    imputedCells,
  };
}

function transformRow(row, preprocessor, selected = true) {
  const output = [];
  FEATURE_COLUMNS.forEach((column, columnIndex) => {
    let value = row.values[columnIndex];
    if (!Number.isFinite(value)) value = preprocessor.medians[column];
    const bounds = preprocessor.bounds[column];
    if (bounds) value = Math.min(bounds[1], Math.max(bounds[0], value));

    if (CATEGORICAL_COLUMNS.has(column)) {
      const categories = preprocessor.categoryValues[column].slice(1);
      categories.forEach((category) => output.push(value === category ? 1 : 0));
    } else {
      output.push(value);
    }
  });

  return selected
    ? preprocessor.selectedFeatureIndices.map((index) => output[index])
    : output;
}

function selectUncorrelatedFeatures(matrix) {
  if (!matrix.length) return [];
  const keep = [];
  for (let column = 0; column < matrix[0].length; column += 1) {
    let redundant = false;
    for (const prior of keep) {
      if (correlation(matrix, prior, column) > 0.9) {
        redundant = true;
        break;
      }
    }
    if (!redundant) keep.push(column);
  }
  return keep.length ? keep : [0];
}

function correlation(matrix, first, second) {
  let sumFirst = 0;
  let sumSecond = 0;
  let sumFirstSquare = 0;
  let sumSecondSquare = 0;
  let sumProduct = 0;
  for (const row of matrix) {
    const left = row[first];
    const right = row[second];
    sumFirst += left;
    sumSecond += right;
    sumFirstSquare += left * left;
    sumSecondSquare += right * right;
    sumProduct += left * right;
  }
  const count = matrix.length;
  const covariance = count * sumProduct - sumFirst * sumSecond;
  const varianceProduct = (count * sumFirstSquare - sumFirst * sumFirst)
    * (count * sumSecondSquare - sumSecond * sumSecond);
  return varianceProduct > 0 ? covariance / Math.sqrt(varianceProduct) : 0;
}

function balancedWeights(labels) {
  const counts = [0, 0];
  labels.forEach((label) => { counts[label] += 1; });
  return labels.map((label) => labels.length / (2 * counts[label]));
}

function weightedGini(positiveWeight, negativeWeight) {
  const total = positiveWeight + negativeWeight;
  if (total === 0) return 0;
  const positiveShare = positiveWeight / total;
  const negativeShare = negativeWeight / total;
  return 1 - positiveShare * positiveShare - negativeShare * negativeShare;
}

function findBestSplit(matrix, labels, weights, indices, features, random, minLeafSize) {
  let best = null;
  let totalPositive = 0;
  let totalWeight = 0;
  for (const index of indices) {
    totalWeight += weights[index];
    if (labels[index] === 1) totalPositive += weights[index];
  }
  const totalNegative = totalWeight - totalPositive;
  const parentGini = weightedGini(totalPositive, totalNegative);

  for (const feature of features) {
    const points = indices.map((index) => ({ index, value: matrix[index][feature] }));
    points.sort((a, b) => a.value - b.value);
    let leftPositive = 0;
    let leftWeight = 0;
    let nextCandidate = Math.max(minLeafSize, Math.ceil(points.length / 32));

    for (let position = 0; position < points.length - minLeafSize; position += 1) {
      const point = points[position];
      const weight = weights[point.index];
      leftWeight += weight;
      if (labels[point.index] === 1) leftPositive += weight;

      const leftCount = position + 1;
      if (
        point.value === points[position + 1].value
        || leftCount < minLeafSize
        || points.length - leftCount < minLeafSize
        || leftCount < nextCandidate
      ) continue;

      const rightWeight = totalWeight - leftWeight;
      const rightPositive = totalPositive - leftPositive;
      const gain = parentGini
        - (leftWeight / totalWeight) * weightedGini(leftPositive, leftWeight - leftPositive)
        - (rightWeight / totalWeight) * weightedGini(rightPositive, rightWeight - rightPositive);
      if (!best || gain > best.gain) {
        best = {
          feature,
          threshold: point.value + (points[position + 1].value - point.value) / 2,
          gain,
        };
      }
      nextCandidate += Math.max(minLeafSize, Math.ceil(points.length / 32));
    }
  }
  return best && best.gain > 1e-10 ? best : null;
}

function buildTree(matrix, labels, weights, options) {
  const { maxDepth, minLeafSize, featureCount, random, importances } = options;
  const rootWeight = weights.reduce((sum, weight) => sum + weight, 0);

  function grow(indices, depth) {
    let positiveWeight = 0;
    let nodeWeight = 0;
    for (const index of indices) {
      nodeWeight += weights[index];
      if (labels[index] === 1) positiveWeight += weights[index];
    }
    const node = {
      probability: nodeWeight ? positiveWeight / nodeWeight : 0,
    };
    if (
      depth >= maxDepth
      || indices.length < minLeafSize * 2
      || positiveWeight === 0
      || positiveWeight === nodeWeight
    ) return node;

    const availableFeatures = matrix[0].length;
    const featureIndices = Array.from({ length: availableFeatures }, (_, index) => index);
    const sampledFeatures = featureCount < availableFeatures
      ? shuffled(featureIndices, random).slice(0, featureCount)
      : featureIndices;
    const split = findBestSplit(matrix, labels, weights, indices, sampledFeatures, random, minLeafSize);
    if (!split) return node;

    const left = [];
    const right = [];
    indices.forEach((index) => {
      (matrix[index][split.feature] < split.threshold ? left : right).push(index);
    });
    if (!left.length || !right.length) return node;

    importances[split.feature] += split.gain * nodeWeight / rootWeight;
    node.feature = split.feature;
    node.threshold = split.threshold;
    node.left = grow(left, depth + 1);
    node.right = grow(right, depth + 1);
    return node;
  }

  return grow(Array.from({ length: matrix.length }, (_, index) => index), 0);
}

function predictTree(tree, row) {
  let node = tree;
  while (node.feature !== undefined) {
    node = row[node.feature] < node.threshold ? node.left : node.right;
  }
  return node.probability;
}

function meanAndScale(matrix) {
  const columns = matrix[0].length;
  const means = Array(columns).fill(0);
  const scales = Array(columns).fill(0);
  matrix.forEach((row) => row.forEach((value, index) => { means[index] += value; }));
  means.forEach((_, index) => { means[index] /= matrix.length; });
  matrix.forEach((row) => row.forEach((value, index) => {
    scales[index] += (value - means[index]) ** 2;
  }));
  scales.forEach((_, index) => {
    scales[index] = Math.sqrt(scales[index] / matrix.length) || 1;
  });
  return { means, scales };
}

function scaleRow(row, scale) {
  return row.map((value, index) => (value - scale.means[index]) / scale.scales[index]);
}

function sigmoid(value) {
  if (value < -30) return 0;
  if (value > 30) return 1;
  return 1 / (1 + Math.exp(-value));
}

async function trainLogisticRegression(matrix, labels, weights, progress) {
  const scale = meanAndScale(matrix);
  const scaled = matrix.map((row) => scaleRow(row, scale));
  const parameters = Array(matrix[0].length + 1).fill(0);
  const epochs = 140;
  const learningRate = 0.2;
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradient = Array(parameters.length).fill(0);
    for (let rowIndex = 0; rowIndex < scaled.length; rowIndex += 1) {
      const row = scaled[rowIndex];
      let score = parameters[parameters.length - 1];
      for (let column = 0; column < row.length; column += 1) {
        score += parameters[column] * row[column];
      }
      const error = (sigmoid(score) - labels[rowIndex]) * weights[rowIndex];
      for (let column = 0; column < row.length; column += 1) {
        gradient[column] += error * row[column];
      }
      gradient[gradient.length - 1] += error;
    }
    const step = learningRate / weightTotal;
    for (let column = 0; column < parameters.length - 1; column += 1) {
      parameters[column] -= step * (gradient[column] + 0.001 * parameters[column]);
    }
    parameters[parameters.length - 1] -= step * gradient[gradient.length - 1];

    if ((epoch + 1) % 10 === 0) {
      progress(Math.round(((epoch + 1) / epochs) * 100));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    scale,
    parameters,
    predict(row) {
      const scaledRow = scaleRow(row, scale);
      let score = parameters[parameters.length - 1];
      for (let column = 0; column < scaledRow.length; column += 1) {
        score += parameters[column] * scaledRow[column];
      }
      return sigmoid(score);
    },
  };
}

function classificationMetrics(labels, probabilities) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let trueNegative = 0;
  probabilities.forEach((probability, index) => {
    const predicted = probability >= 0.5 ? 1 : 0;
    const actual = labels[index];
    if (predicted === 1 && actual === 1) truePositive += 1;
    else if (predicted === 1) falsePositive += 1;
    else if (actual === 1) falseNegative += 1;
    else trueNegative += 1;
  });
  const precision = truePositive + falsePositive ? truePositive / (truePositive + falsePositive) : 0;
  const recall = truePositive + falseNegative ? truePositive / (truePositive + falseNegative) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return {
    accuracy: (truePositive + trueNegative) / labels.length,
    precision,
    recall,
    f1,
    rocAuc: calculateAuc(labels, probabilities),
    confusion: { truePositive, falsePositive, falseNegative, trueNegative },
  };
}

function calculateAuc(labels, probabilities) {
  const ordered = labels
    .map((label, index) => ({ label, probability: probabilities[index] }))
    .sort((a, b) => a.probability - b.probability);
  const positiveCount = labels.filter((label) => label === 1).length;
  const negativeCount = labels.length - positiveCount;
  if (!positiveCount || !negativeCount) return 0;

  let positiveRankSum = 0;
  let index = 0;
  while (index < ordered.length) {
    let end = index + 1;
    while (end < ordered.length && ordered[end].probability === ordered[index].probability) end += 1;
    const averageRank = ((index + 1) + end) / 2;
    for (let tied = index; tied < end; tied += 1) {
      if (ordered[tied].label === 1) positiveRankSum += averageRank;
    }
    index = end;
  }
  return (positiveRankSum - (positiveCount * (positiveCount + 1)) / 2)
    / (positiveCount * negativeCount);
}

function computeDelayRates(rows) {
  const groups = [
    { label: "On time / early", filter: (value) => value <= 0 },
    { label: "1 month late", filter: (value) => value === 1 },
    { label: "2+ months late", filter: (value) => value >= 2 },
  ];
  return groups.map((group) => {
    const values = rows.filter((row) => Number.isFinite(row.values[5]) && group.filter(row.values[5]));
    const defaultCount = values.filter((row) => row.target === 1).length;
    return {
      label: group.label,
      count: values.length,
      defaultRate: values.length ? defaultCount / values.length : null,
    };
  });
}

function progressMessage(progress, phase, detail) {
  progress({ phase, detail });
}

export async function analyzeAndTrain(text, progress = () => {}) {
  progressMessage(progress, "parsing", "Reading CSV and validating UCI columns");
  const parsed = parseCsv(text);
  if (!parsed.targetColumn) {
    return { kind: "score", parsed };
  }

  const seen = new Set();
  let duplicatesRemoved = 0;
  const rows = [];
  for (const row of parsed.rows) {
    const signature = `${row.values.join("|")}|${row.target}`;
    if (seen.has(signature)) {
      duplicatesRemoved += 1;
    } else {
      seen.add(signature);
      rows.push(row);
    }
  }

  const { trainIndices, testIndices } = stratifiedSplit(rows);
  const trainRows = trainIndices.map((index) => rows[index]);
  const testRows = testIndices.map((index) => rows[index]);
  progressMessage(progress, "preprocessing", "Imputing missing values, capping outliers, encoding categories");
  const { preprocessor, trainMatrix, imputedCells } = fitPreprocessor(trainRows);
  const testMatrix = testRows.map((row) => transformRow(row, preprocessor));
  const trainLabels = trainRows.map((row) => row.target);
  const testLabels = testRows.map((row) => row.target);
  const weights = balancedWeights(trainLabels);

  progressMessage(progress, "logistic", "Training balanced logistic regression");
  const logistic = await trainLogisticRegression(
    trainMatrix,
    trainLabels,
    weights,
    (percentage) => progressMessage(progress, "logistic", `Training logistic regression · ${percentage}%`),
  );
  const logisticMetrics = classificationMetrics(
    testLabels,
    testMatrix.map((row) => logistic.predict(row)),
  );

  progressMessage(progress, "tree", "Training decision tree");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const treeImportances = Array(preprocessor.featureNames.length).fill(0);
  const tree = buildTree(trainMatrix, trainLabels, weights, {
    maxDepth: 5,
    minLeafSize: 12,
    featureCount: preprocessor.featureNames.length,
    random: seededRandom(42),
    importances: treeImportances,
  });
  const treeMetrics = classificationMetrics(
    testLabels,
    testMatrix.map((row) => predictTree(tree, row)),
  );

  progressMessage(progress, "forest", "Training Random Forest · 60 trees");
  const forestImportances = Array(preprocessor.featureNames.length).fill(0);
  const forest = [];
  const random = seededRandom(42);
  const treeCount = 60;
  const sampleSize = Math.min(trainRows.length, 4_000);
  for (let treeIndex = 0; treeIndex < treeCount; treeIndex += 1) {
    const sampleIndices = Array.from({ length: sampleSize }, () => Math.floor(random() * trainRows.length));
    const sampledMatrix = sampleIndices.map((index) => trainMatrix[index]);
    const sampledLabels = sampleIndices.map((index) => trainLabels[index]);
    const sampledWeights = sampleIndices.map((index) => weights[index]);
    const importances = Array(preprocessor.featureNames.length).fill(0);
    const model = buildTree(sampledMatrix, sampledLabels, sampledWeights, {
      maxDepth: 8,
      minLeafSize: 10,
      featureCount: Math.max(1, Math.floor(Math.sqrt(preprocessor.featureNames.length))),
      random,
      importances,
    });
    forest.push(model);
    importances.forEach((value, index) => { forestImportances[index] += value; });
    if ((treeIndex + 1) % 4 === 0) {
      progressMessage(progress, "forest", `Training Random Forest · ${treeIndex + 1}/${treeCount} trees`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const forestProbability = (row) => forest.reduce((sum, model) => sum + predictTree(model, row), 0) / forest.length;
  const forestProbabilities = testMatrix.map(forestProbability);
  const forestMetrics = classificationMetrics(testLabels, forestProbabilities);
  const importanceTotal = forestImportances.reduce((sum, value) => sum + value, 0) || 1;
  const topFeatures = forestImportances
    .map((value, index) => ({
      name: preprocessor.featureNames[index],
      importance: value / importanceTotal,
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  const metricRows = [
    { name: "Logistic Regression", key: "logistic", ...logisticMetrics },
    { name: "Decision Tree", key: "tree", ...treeMetrics },
    { name: "Random Forest", key: "forest", ...forestMetrics },
  ];
  const defaultCount = rows.filter((row) => row.target === 1).length;
  const totalCells = trainRows.length * FEATURE_COLUMNS.length;
  const summary = {
    fileRows: parsed.rows.length,
    rows: rows.length,
    duplicatesRemoved,
    missingTargets: parsed.missingTargets,
    imputedCells: imputedCells + trainRows.reduce((count, row) => (
      count + row.values.filter((value) => !Number.isFinite(value)).length
    ), 0),
    missingCells: totalCells ? Math.round((imputedCells / totalCells) * 1000) / 10 : 0,
    defaults: defaultCount,
    defaultRate: defaultCount / rows.length,
    features: preprocessor.featureNames.length,
    target: parsed.targetColumn,
    trainRows: trainRows.length,
    testRows: testRows.length,
    metrics: metricRows,
    topFeatures,
    delayRates: computeDelayRates(rows),
    model: {
      preprocessor,
      forest,
      forestImportances,
      featureNames: preprocessor.featureNames,
    },
  };
  progressMessage(progress, "complete", "Analysis and model evaluation complete");
  return { kind: "trained", summary };
}

export function scoreCsv(text, model) {
  const parsed = parseCsv(text);
  if (parsed.targetColumn) {
    throw new Error("This CSV includes the DEFAULT target. Upload an unlabeled customer CSV to score, or replace the current training analysis.");
  }
  const featureRows = parsed.rows;
  const uniqueRows = [];
  const seen = new Set();
  let duplicatesRemoved = 0;
  for (const row of featureRows) {
    const signature = row.values.join("|");
    if (seen.has(signature)) duplicatesRemoved += 1;
    else {
      seen.add(signature);
      uniqueRows.push(row);
    }
  }
  const { preprocessor, forest } = model;
  const scores = uniqueRows.map((row) => {
    const transformed = transformRow(row, preprocessor);
    return forest.reduce((sum, tree) => sum + predictTree(tree, transformed), 0) / forest.length;
  });
  const output = uniqueRows.map((row, index) => ({
    source_row: row.sourceRow,
    default_risk_score: Number(scores[index].toFixed(6)),
    risk_band: scores[index] >= 0.65 ? "High" : scores[index] >= 0.35 ? "Moderate" : "Lower",
  }));
  const csv = Papa.unparse(output);
  const countHigh = output.filter((row) => row.risk_band === "High").length;
  const countModerate = output.filter((row) => row.risk_band === "Moderate").length;
  return {
    rows: output.length,
    duplicatesRemoved,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1),
    high: countHigh,
    moderate: countModerate,
    lower: output.length - countHigh - countModerate,
    preview: output.slice(0, 8),
    csv,
  };
}

