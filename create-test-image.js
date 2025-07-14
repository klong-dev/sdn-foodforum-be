const fs = require('fs');
const path = require('path');

// Create a simple test image (1x1 pixel PNG)
const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG2v8gQEAAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(path.join(__dirname, 'test-image.png'), testImageBuffer);

console.log('Test image created: test-image.png');
