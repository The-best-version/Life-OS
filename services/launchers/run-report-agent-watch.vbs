' Silent watcher for report-agent.js — regenerates the three charts whenever
' the app's sources, apps/step-arena, the iron-log sources or
' graphify-out/data change. Launched at logon from the Startup folder. Stop it
' by ending node.exe.
'
' The agent is one folder up: this launcher lives in services/launchers/.
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
cmd = """C:\Program Files\nodejs\node.exe"" """ & _
      Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & _
      "..\report-agent.js"" --quiet --watch"
sh.Run cmd, 0, False
