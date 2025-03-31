# PowerShell script to create users in Cognito User Pool
$userPoolId = "us-east-1_gZnqU8vRR"
$tempPassword = "Welcome123!"

# Read the players file
$players = Get-Content -Path .\frontend\src\players.txt

# Create each user in Cognito
foreach ($line in $players) {
    # Extract name and email from the format "Name <email@example.com>"
    if ($line.Trim() -match '(.*)<(.*)>') {
        $name = $matches[1].Trim()
        $email = $matches[2].Trim()
        
        Write-Host "Creating user: $email ($name)"
        
        # Create the user in Cognito
        aws cognito-idp admin-create-user `
            --user-pool-id $userPoolId `
            --username $email `
            --temporary-password $tempPassword `
            --user-attributes Name=email,Value=$email Name=name,Value=$name
        
        # Set the user's password so they don't need to change it on first login
        aws cognito-idp admin-set-user-password `
            --user-pool-id $userPoolId `
            --username $email `
            --password $tempPassword `
            --permanent
            
        Write-Host "User created successfully: $email"
    }
    else {
        Write-Host "Warning: Couldn't parse line: $line"
    }
}

Write-Host "All players created as users successfully!"
