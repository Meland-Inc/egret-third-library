RequestExecutionLevel admin

!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
  ; This macro is inserted at the beginning of the NSIS .OnInit callback
  !system "echo '' > ${BUILD_RESOURCES_DIR}/preInit"

  ;64位包
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Program Files\bellplanet\"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Program Files\bellplanet\"

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