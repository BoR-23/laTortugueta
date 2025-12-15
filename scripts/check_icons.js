const fs = require('fs');
const path = require('path');

function getDimensions(filePath) {
    if (!fs.existsSync(filePath)) return 'Not found';

    // minimal png header parsing to get width/height
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // PNG identifier: 89 50 4E 47 0D 0A 1A 0A
    if (buffer.readUInt32BE(0) === 0x89504E47) {
        // IHDR chunk starts at offset 8
        // Width at offset 16, Height at offset 20
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return `${width}x${height}`;
    }
    return 'Unknown format';
}

console.log('src/app/icon.png:', getDimensions('src/app/icon.png'));
console.log('public/apple-touch-icon.png:', getDimensions('public/apple-touch-icon.png'));
console.log('public/og-image.png:', getDimensions('public/og-image.png'));
