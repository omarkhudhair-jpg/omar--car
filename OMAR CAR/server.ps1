# Simple HTTP Server using PowerShell
$port = 8000

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $localIP) { $localIP = "localhost" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   OMAR CAR Server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server is running!" -ForegroundColor Green
Write-Host ""
Write-Host "From mobile phone, open browser and type:" -ForegroundColor Yellow
Write-Host "   http://$($localIP):$port" -ForegroundColor White
Write-Host ""
Write-Host "From computer:" -ForegroundColor Yellow
Write-Host "   http://localhost:$port" -ForegroundColor White
Write-Host ""
Write-Host "Make sure phone and computer are on same WiFi network" -ForegroundColor Red
Write-Host ""
Write-Host "Press Ctrl+C to stop server" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# MIME types
$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.json'  = 'application/json; charset=utf-8'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.gif'   = 'image/gif'
    '.svg'   = 'image/svg+xml'
    '.ico'   = 'image/x-icon'
    '.webp'  = 'image/webp'
    '.woff'  = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'   = 'font/ttf'
    '.eot'   = 'application/vnd.ms-fontobject'
    '.otf'   = 'font/otf'
}

# Create listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://$($localIP):$port/")
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestedPath = $request.Url.LocalPath
        if ($requestedPath -eq '/') { $requestedPath = '/index.html' }
        
        $filePath = Join-Path $PSScriptRoot $requestedPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = $mimeTypes[$extension]
                if (-not $contentType) { $contentType = 'application/octet-stream' }
                
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $content.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($content, 0, $content.Length)
                
                Write-Host "OK $requestedPath" -ForegroundColor Green
            }
            catch {
                Write-Host "ERROR $requestedPath : $_" -ForegroundColor Red
                $response.StatusCode = 500
            }
        }
        else {
            Write-Host "NOT FOUND: $requestedPath" -ForegroundColor Red
            $response.StatusCode = 404
            $errorMessage = [System.Text.Encoding]::UTF8.GetBytes('<h1>404 - File Not Found</h1>')
            $response.ContentType = 'text/html; charset=utf-8'
            $response.ContentLength64 = $errorMessage.Length
            $response.OutputStream.Write($errorMessage, 0, $errorMessage.Length)
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "Server stopped" -ForegroundColor Yellow
}
