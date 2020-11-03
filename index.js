const fs = require('fs');
const csv = require('csv-parser');

const web3 = require('web3');
const BN = require('bn.js');

const replacements = require('./data/replacements.json');

const processLine = function (line, linesRead) {
  if (line.Status === '' && line['Value_IN(ETH)'] !== '0') {
    linesRead.push({
      from: web3.utils.toChecksumAddress(line.From),
      value: new BN(web3.utils.toWei(line['Value_IN(ETH)'])),
    });
  }
};

const processLines = function (lines) {
  const totals = {};

  for (var line of lines) {
    totals[line.from] = (totals[line.from] || new BN(0)).add(line.value);
  }

  for (var replacement of replacements) {
    totals[replacement[1]] = (totals[replacement[1]] || new BN(0)).add(
      totals[replacement[0]] || new BN(0)
    );

    delete totals[replacement[0]];
  }

  let output = [];

  for (var address in totals) {
    output.push([address, totals[address].mul(new BN(4)).toString()]);
  }

  fs.writeFileSync(`${ __dirname }/airdrops.json`, JSON.stringify(output, null, 2), { flag: 'w' });
};

const linesRead = [];

fs.createReadStream('./data/amplyfi.csv')
  .pipe(csv())
  .on('data', line => processLine(line, linesRead))
  .on('end', () => processLines(linesRead));
