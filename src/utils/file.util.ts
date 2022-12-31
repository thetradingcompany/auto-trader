import * as fs from 'fs';

export function convertJSONObjToCSVRow(json: Record<string, any>) {
  let csvEntry = ``;

  Object.entries(json).forEach((entry) => {
    csvEntry += `${entry[1] ?? '-'},`;
  });

  csvEntry = csvEntry.slice(0, -1);
  csvEntry += '\r\n';

  return csvEntry;
}

export function jsonDataReplacer(key, value) {
  return value === null ? '' : value;
}

export function writeCSVRowToFile(csvRow: string, fileName: string): void {
  if (fs.existsSync(fileName)) {
    fs.appendFileSync(fileName, csvRow);
  } else {
    fs.writeFileSync(fileName, csvRow);
  }

  return;
}

export function writeJSONObjToFile(jsonObj: Record<string, any>, fileName: string): void {
  if (fs.existsSync(fileName)) {
    fs.appendFileSync(fileName, JSON.stringify(jsonObj, jsonDataReplacer, 2));
  } else {
    fs.writeFileSync(fileName, JSON.stringify(jsonObj, jsonDataReplacer, 2));
  }
  fs.appendFileSync(fileName, ',\r\n');

  return;
}
