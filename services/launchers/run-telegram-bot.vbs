' Starts the Telegram bot with no console window. Drop a shortcut to this in
' shell:startup to have it come up with Windows, beside the sync server.
'
' It reads the state through http://127.0.0.1:47615, so the sync server has to
' be up — but there is no ordering problem to solve here: every message the
' bot cannot deliver answers «ما قدرت أوصل للخادم المحلي» and the next one
' works, so starting in either order is fine.
'
' A second copy is NOT safe the way a second sync server is: two long-polling
' clients on one token take turns stealing each other's updates, and the
' symptom is a bot that answers every other message. One copy only.
'
' The bot is one folder up and one across: this launcher lives in
' services/launchers/.
Dim sh, dir, cmd
Set sh = CreateObject("WScript.Shell")
dir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & "..\.."
sh.CurrentDirectory = dir
cmd = """C:\Program Files\nodejs\node.exe"" """ & dir & "\services\telegram-bot\bot.js"""
sh.Run cmd, 0, False
