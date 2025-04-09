import path from "path";

import * as TSUP from 'tsup';

//

const bundlingOutputDirectoryPath = 'dist';
const projectRoot = path.resolve(__dirname);
const outputDir = path.resolve(__dirname, bundlingOutputDirectoryPath);

if (!outputDir.startsWith(projectRoot))
    throw new Error('Output directory must be inside project root');

const projectRootRelToOutputDir = path.relative(outputDir, projectRoot);

//

export default TSUP.defineConfig({
    entry: ['src/index.ts'],
    outDir: bundlingOutputDirectoryPath,
    format: ['esm'],
    sourcemap: true,
    clean: true,
    dts: true,

    define: {
        __PROJECT_ROOT__: JSON.stringify(projectRootRelToOutputDir)
    }
});