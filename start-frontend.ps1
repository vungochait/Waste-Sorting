# Starts the React app at http://localhost:5173
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\frontend"
npm run dev
