Option Explicit

Dim shell, files, project, request, apiReady, webReady
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
project = files.GetParentFolderName(WScript.ScriptFullName)

apiReady = False
webReady = False

On Error Resume Next
Set request = CreateObject("MSXML2.XMLHTTP")
request.Open "GET", "http://127.0.0.1:8000/api/health", False
request.Send
apiReady = (request.Status = 200)

Set request = CreateObject("MSXML2.XMLHTTP")
request.Open "GET", "http://127.0.0.1:5173", False
request.Send
webReady = (request.Status = 200)
On Error GoTo 0

If Not apiReady Then
    shell.CurrentDirectory = project & "\backend"
    shell.Run Chr(34) & project & "\backend\.venv\Scripts\python.exe" & Chr(34) & " -m uvicorn app.main:app --host 127.0.0.1 --port 8000", 0, False
End If

If Not webReady Then
    shell.CurrentDirectory = project & "\frontend"
    shell.Run "cmd.exe /c npm run dev", 0, False
End If

WScript.Sleep 3500
shell.Run "http://127.0.0.1:5173", 1, False

