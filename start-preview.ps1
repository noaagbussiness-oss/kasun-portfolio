# Run from the project folder, then open http://localhost:4173
Set-Location -LiteralPath $PSScriptRoot
python -m http.server 4173 --bind 127.0.0.1
