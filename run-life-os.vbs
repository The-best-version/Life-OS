' --- يفتح 2027 Life OS ------------------------------------------------
'  The app no longer opens as a file. It is served from 127.0.0.1 so that
'  Chrome gives it an origin of its own — a file:// page shares one storage
'  bucket with every other local html document on the machine, cannot be
'  installed, and cannot have its data marked persistent.
'
'  The server starts with Windows, but this does not assume that. It checks,
'  starts it if it has to, waits for it to answer, and only then opens
'  Chrome — because Chrome arriving half a second early shows an error page,
'  and an error page where the day's routine should be is alarming in a way
'  the problem never warranted.
' ----------------------------------------------------------------------

Option Explicit

Const URL  = "http://127.0.0.1:47615/"
Const PROBE = "http://127.0.0.1:47615/state?project=lifeos"
Const NODE = "C:\Program Files\nodejs\node.exe"
Const CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Dim sh, fso, root, i
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)

If Not Up() Then
  sh.Run """" & NODE & """ """ & root & "\local-sync-server.js"" --quiet", 0, False
  ' Ten seconds, a quarter at a time. Node starts in well under one; the
  ' rest of the budget is for a cold disk after a reboot.
  For i = 1 To 40
    WScript.Sleep 250
    If Up() Then Exit For
  Next
End If

If Not Up() Then
  MsgBox "تعذّر تشغيل خادم الحفظ المحلي." & vbCrLf & vbCrLf & _
         "افتح موجّه الأوامر ونفّذ:" & vbCrLf & _
         "node """ & root & "\local-sync-server.js""", 48, "2027 Life OS"
  WScript.Quit 1
End If

sh.Run """" & CHROME & """ --app=" & URL, 1, False

' A request, not a port scan: VBScript has no socket, and an HTTP round trip
' answers the question that actually matters — is it serving?
Function Up()
  Dim x
  Up = False
  On Error Resume Next
  Set x = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  If Err.Number <> 0 Then Exit Function
  x.SetTimeouts 400, 400, 1500, 1500
  x.Open "GET", PROBE, False
  x.Send
  If Err.Number = 0 Then Up = (x.Status = 200)
  On Error GoTo 0
End Function
