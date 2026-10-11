' Silent launcher for report-agent.js — no console window.
' The agent is one folder up: this launcher lives in services/launchers/.
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
cmd = """C:\Program Files\nodejs\node.exe"" """ & _
      Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & _
      "..\report-agent.js"" --quiet"
sh.Run cmd, 0, True
