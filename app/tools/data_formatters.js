function flattenObject(input, prefix = "") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const flattened = {};

  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, nextKey));
      continue;
    }

    flattened[nextKey] = value;
  }

  return flattened;
}

function escapeCsvCell(value) {
  const normalized = value == null ? "" : String(value);
  const singleLine = normalized.replaceAll("\r\n", "\\n").replaceAll("\n", "\\n");
  const escapedQuotes = singleLine.replaceAll('"', '""');
  return `"${escapedQuotes}"`;
}

export function recordsToCsv(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return "";
  }

  const flattenedRecords = records.map((record) => flattenObject(record));
  const columns = [];

  for (const record of flattenedRecords) {
    for (const key of Object.keys(record)) {
      if (!columns.includes(key)) {
        columns.push(key);
      }
    }
  }

  if (columns.length === 0) {
    return "";
  }

  const header = columns.join(",");
  const rows = flattenedRecords.map((record) => {
    return columns.map((column) => escapeCsvCell(record[column])).join(",");
  });

  return [header, ...rows].join("\n");
}

