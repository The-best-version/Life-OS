' Starts the gym bot with no console window.
Dim sh, dir, cmd
Set sh = CreateObject("WScript.Shell")
dir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & "..\.."
sh.CurrentDirectory = dir
cmd = """C:\Program Files\nodejs\node.exe"" """ & dir & "\services\telegram-gym-bot\bot.js"""
sh.Run cmd, 0, False
