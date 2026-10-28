' Starts the local sync server with no console window. Launched at logon from
' the Startup folder; a second copy exits on its own with EADDRINUSE, so this
' is safe to run when one is already up.
' The server is one folder up: this launcher lives in services/launchers/.
'
' LIFEOS_WEB_URL is set here, not only as a Windows environment variable,
' because `sh.Run` spawns the server as a fresh child of THIS process and a
' value set with `setx`/System Properties only reaches a child started by a
' process that began *after* that change propagated (a new logon, usually) —
' this launcher, run from the Startup folder at boot, is exactly that kind
' of process, so a stale copy of the variable silently serving the gym site
' with Tailscale writes refused is the common case, not the rare one. Setting
' it on `sh.Environment("Process")` guarantees the child always has it,
' whatever is or isn't set anywhere else.
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
sh.Environment("Process")("LIFEOS_WEB_URL") = "https://zmal.tail9d1cb9.ts.net"
cmd = """C:\Program Files\nodejs\node.exe"" """ & _
      Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & _
      "..\local-sync-server.js"" --quiet"
sh.Run cmd, 0, False
