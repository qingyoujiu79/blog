$ErrorActionPreference = 'Continue'
$ROOT = 'C:\Users\jiuzhiqing\WorkBuddy\2026-11-11-18-29-51\blog'
$PYW = 'C:\Users\jiuzhiqing\AppData\Local\Programs\Python\Python311\pythonw.exe'
$PORT = 8899

# check if blog server is listening
function Test-Running {
    $c = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    return [bool]$c
}

if (Test-Running) {
    Write-Host "already running"
    exit 0
}

Write-Host "not running, starting..."
Start-Process cmd.exe -ArgumentList '/c', 'start', '', '/D', $ROOT, $PYW, 'serve.py' -WindowStyle Hidden
Start-Sleep -Seconds 4

if (Test-Running) {
    $c = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    Write-Host ("started pid=" + $c[0].OwningProcess)
} else {
    Write-Host "FAILED to start"
    exit 1
}
