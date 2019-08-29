'use strict';

const xlsx = exports.xlsx = {};

Object.assign(xlsx, require('xlsx'));

xlsx.createSimpleWorkbookAOA = createSimpleWorkbookAOA;

function createSimpleWorkbookAOA(aoa, sheetName = 'Export') {
  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.aoa_to_sheet(aoa);
  xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  return xlsx.write(workbook, { type: 'buffer' });
}
