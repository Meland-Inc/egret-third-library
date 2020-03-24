RequestExecutionLevel admin

!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
  ; This macro is inserted at the beginning of the NSIS .OnInit callback
  !system "echo '' > ${BUILD_RESOURCES_DIR}/preInit"

  StrCpy $R1 "D:\"
  ${DriveSpace} $R1 "/D=F /S=M" $R0
  ${If} $R0 = null
  ${OrIf} $R0 < 1024
    StrCpy $R1 "E:\"
    ${DriveSpace} $R1 "/D=F /S=M" $R0
    ${If} $R0 = null
    ${OrIf} $R0 < 1024
      StrCpy $R1 "F:\"
      ${DriveSpace} $R1 "/D=F /S=M" $R0
      ${If} $R0 = null
      ${OrIf} $R0 < 1024
        StrCpy $R1 "C:\"
        ${DriveSpace} $R1 "/D=F /S=M" $R0
        ${If} $R0 = null
        ${OrIf} $R0 < 1024
          MessageBox MB_OK "电脑无可用磁盘,请检查!"
          Abort
        ${EndIf}
      ${EndIf}
    ${EndIf}
  ${EndIf}

  ;64位包
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$R1Program Files\bellplanet\"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$R1Program Files\bellplanet\"

  ;32位包
  ; SetRegView 32
  ; WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Program Files (x86)\bellplanet\"
  ; WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Program Files (x86)\bellplanet\"
!macroend

!macro customInit
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
!macroend

!macro customInstall
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInstall"
  WriteRegStr HKCR "bellplanet" "URL Protocol" ""
  WriteRegStr HKCR "bellplanet" "" "URL:bellplanet Protocol Handler"
  WriteRegStr HKCR "bellplanet\shell\open\command" "" '"$INSTDIR\bellplanet.exe" "%1"'
!macroend

!macro customUnInit
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
!macroend

!macro customUnInstall
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customUnInstall"
  DeleteRegKey HKCR "bellplanet"
  DeleteRegKey HKCR "bellplanet\shell\open\command"
!macroend

!macro customInstallMode
  # set $isForceMachineInstall or $isForceCurrentInstall 
  # to enforce one or the other modes.
!macroend