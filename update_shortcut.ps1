# PowerShell script to update desktop shortcut

$desktopPath = "$env:USERPROFILE\Desktop"
$shortcutPath = "$desktopPath\MyApp.lnk"
$exePath = "d:\copy-fyp-git\fyp-new-27-02-26\fyp\dist\MyApp-win32-x64\MyApp.exe"
$iconPath = "d:\copy-fyp-git\fyp-new-27-02-26\fyp\icon.ico"
$newName = "Safety Detector"

# Create COM object for Windows Script Host
$shell = New-Object -ComObject WScript.Shell

# Create or update the shortcut
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.IconLocation = $iconPath
$shortcut.Save()

# Rename the shortcut file
$newShortcutPath = "$desktopPath\$newName.lnk"
if (Test-Path $shortcutPath) {
    Rename-Item -Path $shortcutPath -NewName "$newName.lnk" -Force
}

Write-Host "Shortcut updated successfully!"
Write-Host "Name: $newName"
Write-Host "Location: $newShortcutPath"
Write-Host "Icon: $iconPath"
