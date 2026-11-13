# Preview-only QA setup. Secret values never enter command arguments or logs.
$ErrorActionPreference='Stop'
if (-not $IsWindows) { throw 'Windows DPAPI required for the local QA admin secret' }
$secretPath=Join-Path (Get-Location) '.tokensave\d1-preview-admin.dpapi'
if (Test-Path -LiteralPath $secretPath) { $secure=(Get-Content -Raw -LiteralPath $secretPath).Trim() | ConvertTo-SecureString }
else { $random=[byte[]]::new(32);[Security.Cryptography.RandomNumberGenerator]::Fill($random);$raw=[Convert]::ToBase64String($random);$secure=ConvertTo-SecureString $raw -AsPlainText -Force;$secure | ConvertFrom-SecureString | Set-Content -LiteralPath $secretPath }
$raw=[Net.NetworkCredential]::new('', $secure).Password
$wrangler=Get-Content -Raw -LiteralPath "$env:APPDATA\xdg.config\.wrangler\config\default.toml"
$oauth=[regex]::Match($wrangler,'oauth_token\s*=\s*"([^"]+)"').Groups[1].Value
$headers=@{Authorization="Bearer $oauth";'Content-Type'='application/json'}
$url='https://api.cloudflare.com/client/v4/accounts/981c8c76bc6db02b1f2534e7054a7536/pages/projects/zenkilab'
try {
 $project=Invoke-RestMethod -Headers $headers -Uri $url
 $productionBefore=$project.result.deployment_configs.production | ConvertTo-Json -Depth 25 -Compress
 $vars=@{}
 foreach($item in $project.result.deployment_configs.preview.env_vars.PSObject.Properties){
  if($item.Value.type -eq 'secret_text' -and $item.Name -ne 'SUBMISSIONS_ADMIN_TOKEN'){throw 'Existing preview secret requires owner-managed update; refusing to rewrite opaque secrets'}
  $vars[$item.Name]=$item.Value
 }
 $vars['SUBMISSIONS_ADMIN_TOKEN']=@{type='secret_text';value=$raw}
 $vars['SUBMISSION_STORAGE_BACKEND']=@{type='plain_text';value='d1'}
 $vars['SUBMISSION_STORAGE_MAX_BYTES']=@{type='plain_text';value='67108864'}
 $patch=@{deployment_configs=@{preview=@{env_vars=$vars}}}|ConvertTo-Json -Depth 20
 $updated=Invoke-RestMethod -Headers $headers -Uri $url -Method Patch -Body $patch
 if(($updated.result.deployment_configs.production | ConvertTo-Json -Depth 25 -Compress) -ne $productionBefore){throw 'Production configuration differs'}
 Write-Output 'Preview D1 selected; QA admin stored with Windows DPAPI; production configuration unchanged. No email provider key set.'
} catch { throw 'Preview setup could not complete safely. Secret values were not logged.' }

