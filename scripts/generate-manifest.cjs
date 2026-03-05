const fs = require('fs');
const path = require('path');

function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);

  return (
    date instanceof Date &&
    !isNaN(date) &&
    dateString === date.toISOString().split('T')[0]
  );
}

function generateManifest() {
  const dataDir = path.join(__dirname, '..', 'data');
  const targets = [];

  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir);
      console.log('Created data directory:', dataDir);
    } catch (err) {
      console.error('Error creating data directory:', err.message);
      process.exit(1);
    }
  }

  const entries = fs.readdirSync(dataDir);

  entries.forEach(function(entry) {
    if (entry === 'manifest.json') return;

    const targetPath = path.join(dataDir, entry);

    let stats;
    try {
      stats = fs.statSync(targetPath);
    } catch (err) {
      return;
    }

    if (!stats.isDirectory()) return;

    let files;
    try {
      files = fs.readdirSync(targetPath);
    } catch (err) {
      console.error(
        'Error scanning target directory ' + entry + ':',
        err.message
      );
      return;
    }

    const dates = [];

    files.forEach(function(fileEntry) {
      if (fileEntry.slice(-4) === '.csv') {
        const dateStr = fileEntry.replace('.csv', '');

        if (isValidDate(dateStr)) {
          dates.push(dateStr);
        }
      }
    });

    dates.sort();

    if (dates.length > 0) {
      targets.push({
        name: entry,
        dates: dates
      });
    }
  });

  targets.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  const manifest = { targets };
  const manifestPath = path.join(dataDir, 'manifest.json');

  try {
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(manifest, null, 2)
    );
  } catch (err) {
    console.error('Error writing manifest:', err.message);
    process.exit(1);
  }

  const totalDates = targets.reduce(function(sum, target) {
    return sum + target.dates.length;
  }, 0);

  console.log(
    '✓ Generated manifest with ' +
    targets.length +
    ' target(s) and ' +
    totalDates +
    ' date file(s) at ' +
    manifestPath
  );
}

generateManifest();