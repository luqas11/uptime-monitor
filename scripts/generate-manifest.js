const fs = require('fs');
const path = require('path');

// Promisified helpers for Node 8
function readdir(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

function stat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}

function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Validate date format (YYYY-MM-DD)
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

  return readdir(dataDir)
    .then(entries => {
      const checks = entries.map(entry => {
        if (entry === 'manifest.json') return null;

        const targetPath = path.join(dataDir, entry);

        return stat(targetPath)
          .then(stats => {
            if (!stats.isDirectory()) return null;

            return readdir(targetPath)
              .then(files => {
                const dates = [];

                files.forEach(fileEntry => {
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
              })
              .catch(err => {
                console.error(
                  'Error scanning target directory ' + entry + ':',
                  err.message
                );
              });
          })
          .catch(() => null);
      });

      return Promise.all(checks);
    })
    .then(() => {
      targets.sort((a, b) => a.name.localeCompare(b.name));

      const manifest = { targets };
      const manifestPath = path.join(dataDir, 'manifest.json');

      return writeFile(
        manifestPath,
        JSON.stringify(manifest, null, 2)
      ).then(() => {
        const totalDates = targets.reduce((sum, target) => {
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
      });
    })
    .catch(err => {
      console.error('Error generating manifest:', err.message);
      process.exit(1);
    });
}

generateManifest();