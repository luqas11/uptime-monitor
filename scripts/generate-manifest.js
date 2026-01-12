import { readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateManifest() {
    const dataDir = join(__dirname, '..', 'public', 'data');
    const files = [];

    // Ensure data directory exists
    try {
        await mkdir(dataDir, { recursive: true });
    } catch (err) {
        // Directory might already exist, that's fine
    }

    async function scanDir(dir, prefix = '') {
        try {
            const entries = await readdir(dir);

            for (const entry of entries) {
                // Skip manifest.json itself
                if (entry === 'manifest.json') continue;

                const fullPath = join(dir, entry);
                const stats = await stat(fullPath);

                if (stats.isDirectory()) {
                    await scanDir(fullPath, join(prefix, entry));
                } else if (entry.endsWith('.csv')) {
                    const relativePath = join(prefix, entry).replace(/\\/g, '/');
                    // Generate display name: remove .csv extension and replace / with " - "
                    const displayName = relativePath.replace('.csv', '').replace(/\//g, ' - ');
                    files.push({ path: relativePath, displayName });
                }
            }
        } catch (err) {
            console.error(`Error scanning directory ${dir}:`, err.message);
        }
    }

    try {
        await scanDir(dataDir);

        // Sort files by path for consistent ordering
        files.sort((a, b) => a.path.localeCompare(b.path));

        const manifest = { files };
        const manifestPath = join(dataDir, 'manifest.json');
        await writeFile(
            manifestPath,
            JSON.stringify(manifest, null, 2)
        );

        console.log(`✓ Generated manifest with ${files.length} file(s) at ${manifestPath}`);
    } catch (err) {
        console.error('Error generating manifest:', err.message);
        process.exit(1);
    }
}

generateManifest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
