$ErrorActionPreference = "Stop"

$remoteName = "de"
$branchName = "main"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "auto: sync $timestamp"

Write-Host "Checking git status..."
$status = git status --porcelain
if ($status) {
  git add -A
  git commit -m $commitMessage
} else {
  Write-Host "No changes to commit."
}

Write-Host "Pushing to $remoteName $branchName..."
git push $remoteName $branchName

Write-Host "Done."
