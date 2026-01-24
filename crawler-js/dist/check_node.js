function main() {
    const nodeVersion = process.versions.node;
    const majorVersion = parseInt(nodeVersion.split('.')[0]);
    if (majorVersion < 18) {
        console.error('Node.js version 18 or higher is required. Please upgrade your Node.js installation.');
        process.exit(1);
    }
}
export {};
