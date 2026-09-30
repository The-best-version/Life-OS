Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
cmd = """C:\Program Files\nodejs\node.exe"" """ & _
      Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & _
      "local-sync-server.js"" --quiet"
sh.Run cmd, 0, False
