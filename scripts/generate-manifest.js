import { readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
}

async function generateManifest() {
    const dataDir = join(__dirname, '..', 'public', 'data');
    const targets = [];

    // Ensure data directory exists
    try {
        await mkdir(dataDir, { recursive: true });
    } catch (err) {
        // Directory might already exist, that's fine
    }

    try {
        const entries = await readdir(dataDir);

        // Scan for target directories
        for (const entry of entries) {
            // Skip manifest.json itself
            if (entry === 'manifest.json') continue;

            const targetPath = join(dataDir, entry);
            const stats = await stat(targetPath);

            // Only process directories (targets)
            if (stats.isDirectory()) {
                const dates = [];

                // Scan target directory for CSV files
                try {
                    const targetEntries = await readdir(targetPath);

                    for (const fileEntry of targetEntries) {
                        if (fileEntry.endsWith('.csv')) {
                            // Extract date from filename (YYYY-MM-DD.csv)
                            const dateStr = fileEntry.replace('.csv', '');

                            // Validate date format
                            if (isValidDate(dateStr)) {
                                dates.push(dateStr);
                            }
                        }
                    }

                    // Sort dates chronologically
                    dates.sort();

                    // Only add target if it has at least one valid date file
                    if (dates.length > 0) {
                        targets.push({
                            name: entry,
                            dates: dates
                        });
                    }
                } catch (err) {
                    console.error(`Error scanning target directory ${entry}:`, err.message);
                }
            }
        }

        // Sort targets alphabetically by name
        targets.sort((a, b) => a.name.localeCompare(b.name));

        const manifest = { targets };
        const manifestPath = join(dataDir, 'manifest.json');
        await writeFile(
            manifestPath,
            JSON.stringify(manifest, null, 2)
        );

        const totalDates = targets.reduce((sum, target) => sum + target.dates.length, 0);
        console.log(`✓ Generated manifest with ${targets.length} target(s) and ${totalDates} date file(s) at ${manifestPath}`);
    } catch (err) {
        console.error('Error generating manifest:', err.message);
        process.exit(1);
    }
}

generateManifest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
