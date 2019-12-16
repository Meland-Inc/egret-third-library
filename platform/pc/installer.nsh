!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AutoupdaterDemoKey" "$INSTDIR\autoupdater-demo.exe"
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AutoupdaterDemoKey"
!macroend