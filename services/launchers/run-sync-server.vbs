' Starts the local sync server with no console window. Launched at logon from
' the Startup folder; a second copy exits on its own with EADDRINUSE, so this
' is safe to run when one is already up.
' The server is one folder up: this launcher lives in services/launchers/.
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
cmd = """C:\Program Files\nodejs\node.exe"" """ & _
      Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & _
      "..\local-sync-server.js"" --quiet"
sh.Run cmd, 0, False
