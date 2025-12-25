$ErrorActionPreference = "Stop"

$remoteName = "de"
$branchName = "main"
$stashCreated = $false
$stashMessage = "auto-stash-before-pull"

function Invoke-Git {
  param([string[]]$GitArgs)
  git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    $argText = $GitArgs -join ' '
    throw "git $argText failed with exit code $LASTEXITCODE"
  }
}

Write-Host "Checking working tree..."
$status = git status --porcelain
if ($status) {
  Write-Host "Uncommitted changes detected, stashing before pull..."
  Invoke-Git -GitArgs @('stash', 'push', '-u', '-m', $stashMessage)
  $stashCreated = $true
}

Write-Host "Pulling latest changes ($remoteName/$branchName)..."
Invoke-Git -GitArgs @('pull', '--rebase', $remoteName, $branchName)

if ($stashCreated) {
  Write-Host "Restoring stashed changes..."
  Invoke-Git -GitArgs @('stash', 'pop')
}

Write-Host "Checking git status..."
$status = git status --porcelain
if ($status) {
  $pattern = '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: ?.+'
  do {
    $commitMessage = Read-Host "Commit message (Conventional Commits, e.g. feat(ui): add login)"
  } while (-not $commitMessage -or -not ($commitMessage -match $pattern))

  Invoke-Git -GitArgs @('add', '-A')
  Invoke-Git -GitArgs @('commit', '-m', $commitMessage)
} else {
  Write-Host "No changes to commit."
}

Write-Host "Pushing to $remoteName $branchName..."
Invoke-Git -GitArgs @('push', $remoteName, $branchName)

Write-Host "Done."
