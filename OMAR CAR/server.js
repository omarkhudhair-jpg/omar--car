const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8000;

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - الملف غير موجود</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('خطأ في الخادم: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log('========================================');
    console.log('   تشغيل خادم التطبيق المحلي');
    console.log('========================================');
    console.log('');
    console.log('✅ الخادم يعمل الآن!');
    console.log('');
    console.log('📱 للوصول من الهاتف، افتح المتصفح واكتب:');
    console.log(`   http://${localIP}:${PORT}`);
    console.log('');
    console.log('💻 للوصول من الكمبيوتر:');
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('⚠️  تأكد أن الهاتف والكمبيوتر على نفس شبكة الواي فاي');
    console.log('');
    console.log('اضغط Ctrl+C لإيقاف الخادم');
    console.log('========================================');
    console.log('');
});
