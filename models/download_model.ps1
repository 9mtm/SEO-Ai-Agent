$url = "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf?download=true"
$output = Join-Path $PSScriptRoot "qwen2.5-3b-instruct-q4_k_m.gguf"
Write-Host "Downloading Qwen2.5-3B-Instruct-Q4_K_M.gguf using BITS..."
Write-Host "URL: $url"
Write-Host "Destination: $output"

try {
    Import-Module BitsTransfer
    Start-BitsTransfer -Source $url -Destination $output -Priority Foreground
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Error "BITS download failed. Falling back to .NET WebClient..."
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($url, $output)
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Error "All download methods failed: $_"
        Write-Host "Please download the file manually from:"
        Write-Host $url
        Write-Host "And place it in: $output"
    }
}
