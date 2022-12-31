// import * as vega from 'vega';
// import * as fs from 'fs';

// export function plotLineChart() {
//   const view = new vega.View(vega.parse(stackedBarChartSpec)).renderer('none').initialize();

//   view
//     .toCanvas()
//     .then(function (canvas) {
//       console.log('Writing PNG to file...');
//       fs.writeFileSync('data/stackedBarChart.png', canvas.toBuffer());
//     })
//     .catch(function (err) {
//       console.log('Error writing PNG to file:');
//       console.error(err);
//     });
// }
