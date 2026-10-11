param([int]$Port = 8777)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Focus Flow serving $root on http://localhost:$Port/"

$types = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.svg' = 'image/svg+xml' }

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))

      if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        if ($types.ContainsKey($ext)) { $ctx.Response.ContentType = $types[$ext] } else { $ctx.Response.ContentType = 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($full)
        if ($ctx.Request.HttpMethod -eq 'HEAD') {
          $ctx.Response.ContentLength64 = $bytes.Length
          $ctx.Response.Close()
        } else {
          $ctx.Response.Close($bytes, $true)
        }
      } else {
        $ctx.Response.StatusCode = 404
        $ctx.Response.Close()
      }
    } catch {
      Write-Host "request error: $($_.Exception.Message)"
      try { $ctx.Response.Abort() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
