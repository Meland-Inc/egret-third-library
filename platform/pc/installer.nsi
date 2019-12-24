; 该脚本使用 HM VNISEdit 脚本编辑器向导产生

; 安装程序初始定义常量
!define PRODUCT_NAME "BellPlanet"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_PUBLISHER "bellcode"
!define PRODUCT_WEB_SITE "http://www.bellcode.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\bellplanet.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma

; ------ MUI 现代界面定义 (1.67 版本以上兼容) ------
!include "MUI.nsh"

; MUI 预定义常量
!define MUI_ABORTWARNING
!define MUI_ICON "F:\bellcode\git\Client\platform\pc\icon.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; 欢迎页面
!insertmacro MUI_PAGE_WELCOME
; 许可协议页面
!insertmacro MUI_PAGE_LICENSE ".\LICENSE.txt"
; 安装目录选择页面
!insertmacro MUI_PAGE_DIRECTORY
; 安装过程页面
!insertmacro MUI_PAGE_INSTFILES
; 安装完成页面
!define MUI_FINISHPAGE_RUN "$INSTDIR\bellplanet.exe"
!insertmacro MUI_PAGE_FINISH

; 安装卸载过程页面
!insertmacro MUI_UNPAGE_INSTFILES

; 安装界面包含的语言设置
!insertmacro MUI_LANGUAGE "SimpChinese"

; 安装预释放文件
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS
; ------ MUI 现代界面定义结束 ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\BellPlanet"
InstallDirRegKey HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\bellplanet.exe"
  CreateDirectory "$SMPROGRAMS\BellPlanet"
  CreateShortCut "$SMPROGRAMS\BellPlanet\BellPlanet.lnk" "$INSTDIR\bellplanet.exe"
  CreateShortCut "$DESKTOP\BellPlanet.lnk" "$INSTDIR\bellplanet.exe"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\chrome_100_percent.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\chrome_200_percent.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\d3dcompiler_47.dll"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\ffmpeg.dll"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\icudtl.dat"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\libEGL.dll"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\libGLESv2.dll"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\LICENSE.electron.txt"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\LICENSES.chromium.html"
  SetOutPath "$INSTDIR\locales"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\am.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ar.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\bg.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\bn.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ca.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\cs.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\da.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\de.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\el.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\en-GB.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\en-US.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\es-419.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\es.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\et.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\fa.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\fi.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\fil.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\fr.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\gu.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\he.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\hi.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\hr.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\hu.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\id.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\it.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ja.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\kn.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ko.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\lt.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\lv.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ml.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\mr.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ms.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\nb.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\nl.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\pl.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\pt-BR.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\pt-PT.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ro.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ru.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\sk.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\sl.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\sr.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\sv.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\sw.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\ta.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\te.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\th.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\tr.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\uk.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\vi.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\zh-CN.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\locales\zh-TW.pak"
  SetOutPath "$INSTDIR"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\natives_blob.bin"
  SetOutPath "$INSTDIR\resources"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\resources\app.asar"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\resources\elevate.exe"
  SetOutPath "$INSTDIR"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\resources.pak"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\snapshot_blob.bin"
  SetOutPath "$INSTDIR\swiftshader"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\swiftshader\libEGL.dll"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\swiftshader\libGLESv2.dll"
  SetOutPath "$INSTDIR"
  File "F:\bellcode\git\Client\platform\pc\build\win-unpacked\v8_context_snapshot.bin"
SectionEnd

Section -AdditionalIcons
  WriteIniStr "$INSTDIR\${PRODUCT_NAME}.url" "InternetShortcut" "URL" "${PRODUCT_WEB_SITE}"
  CreateShortCut "$SMPROGRAMS\BellPlanet\Website.lnk" "$INSTDIR\${PRODUCT_NAME}.url"
  CreateShortCut "$SMPROGRAMS\BellPlanet\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\bellplanet.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\bellplanet.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

/******************************
 *  以下是安装程序的卸载部分  *
 ******************************/

Section Uninstall
  Delete "$INSTDIR\${PRODUCT_NAME}.url"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\v8_context_snapshot.bin"
  Delete "$INSTDIR\swiftshader\libGLESv2.dll"
  Delete "$INSTDIR\swiftshader\libEGL.dll"
  Delete "$INSTDIR\snapshot_blob.bin"
  Delete "$INSTDIR\resources.pak"
  Delete "$INSTDIR\resources\elevate.exe"
  Delete "$INSTDIR\resources\app.asar"
  Delete "$INSTDIR\natives_blob.bin"
  Delete "$INSTDIR\locales\zh-TW.pak"
  Delete "$INSTDIR\locales\zh-CN.pak"
  Delete "$INSTDIR\locales\vi.pak"
  Delete "$INSTDIR\locales\uk.pak"
  Delete "$INSTDIR\locales\tr.pak"
  Delete "$INSTDIR\locales\th.pak"
  Delete "$INSTDIR\locales\te.pak"
  Delete "$INSTDIR\locales\ta.pak"
  Delete "$INSTDIR\locales\sw.pak"
  Delete "$INSTDIR\locales\sv.pak"
  Delete "$INSTDIR\locales\sr.pak"
  Delete "$INSTDIR\locales\sl.pak"
  Delete "$INSTDIR\locales\sk.pak"
  Delete "$INSTDIR\locales\ru.pak"
  Delete "$INSTDIR\locales\ro.pak"
  Delete "$INSTDIR\locales\pt-PT.pak"
  Delete "$INSTDIR\locales\pt-BR.pak"
  Delete "$INSTDIR\locales\pl.pak"
  Delete "$INSTDIR\locales\nl.pak"
  Delete "$INSTDIR\locales\nb.pak"
  Delete "$INSTDIR\locales\ms.pak"
  Delete "$INSTDIR\locales\mr.pak"
  Delete "$INSTDIR\locales\ml.pak"
  Delete "$INSTDIR\locales\lv.pak"
  Delete "$INSTDIR\locales\lt.pak"
  Delete "$INSTDIR\locales\ko.pak"
  Delete "$INSTDIR\locales\kn.pak"
  Delete "$INSTDIR\locales\ja.pak"
  Delete "$INSTDIR\locales\it.pak"
  Delete "$INSTDIR\locales\id.pak"
  Delete "$INSTDIR\locales\hu.pak"
  Delete "$INSTDIR\locales\hr.pak"
  Delete "$INSTDIR\locales\hi.pak"
  Delete "$INSTDIR\locales\he.pak"
  Delete "$INSTDIR\locales\gu.pak"
  Delete "$INSTDIR\locales\fr.pak"
  Delete "$INSTDIR\locales\fil.pak"
  Delete "$INSTDIR\locales\fi.pak"
  Delete "$INSTDIR\locales\fa.pak"
  Delete "$INSTDIR\locales\et.pak"
  Delete "$INSTDIR\locales\es.pak"
  Delete "$INSTDIR\locales\es-419.pak"
  Delete "$INSTDIR\locales\en-US.pak"
  Delete "$INSTDIR\locales\en-GB.pak"
  Delete "$INSTDIR\locales\el.pak"
  Delete "$INSTDIR\locales\de.pak"
  Delete "$INSTDIR\locales\da.pak"
  Delete "$INSTDIR\locales\cs.pak"
  Delete "$INSTDIR\locales\ca.pak"
  Delete "$INSTDIR\locales\bn.pak"
  Delete "$INSTDIR\locales\bg.pak"
  Delete "$INSTDIR\locales\ar.pak"
  Delete "$INSTDIR\locales\am.pak"
  Delete "$INSTDIR\LICENSES.chromium.html"
  Delete "$INSTDIR\LICENSE.electron.txt"
  Delete "$INSTDIR\libGLESv2.dll"
  Delete "$INSTDIR\libEGL.dll"
  Delete "$INSTDIR\icudtl.dat"
  Delete "$INSTDIR\ffmpeg.dll"
  Delete "$INSTDIR\d3dcompiler_47.dll"
  Delete "$INSTDIR\chrome_200_percent.pak"
  Delete "$INSTDIR\chrome_100_percent.pak"
  Delete "$INSTDIR\bellplanet.exe"

  Delete "$SMPROGRAMS\BellPlanet\Uninstall.lnk"
  Delete "$SMPROGRAMS\BellPlanet\Website.lnk"
  Delete "$DESKTOP\BellPlanet.lnk"
  Delete "$SMPROGRAMS\BellPlanet\BellPlanet.lnk"

  RMDir "$SMPROGRAMS\BellPlanet"
  RMDir "$INSTDIR\swiftshader"
  RMDir "$INSTDIR\resources"
  RMDir "$INSTDIR\locales"

  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd

#-- 根据 NSIS 脚本编辑规则，所有 Function 区段必须放置在 Section 区段之后编写，以避免安装程序出现未可预知的问题。--#

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "你确实要完全移除 $(^Name) ，及其所有的组件？" IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) 已成功地从你的计算机移除。"
FunctionEnd
