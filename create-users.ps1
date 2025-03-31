# PowerShell script to create users in Cognito User Pool
$userPoolId = "us-east-1_gZnqU8vRR"

# Read the users file
$users = Get-Content -Path .\users.txt

# Create each user in Cognito
foreach ($line in $users) {
    $parts = $line.Split(',')
    $email = $parts[0]
    $name = $parts[1]
    $password = $parts[2]
    
    Write-Host "Creating user: $email ($name)"
    
    # Create the user in Cognito
    aws cognito-idp admin-create-user `
        --user-pool-id $userPoolId `
        --username $email `
        --temporary-password $password `
        --user-attributes Name=email,Value=$email Name=name,Value=$name
    
    # Set the user's password so they don't need to change it on first login
    aws cognito-idp admin-set-user-password `
        --user-pool-id $userPoolId `
        --username $email `
        --password $password `
        --permanent
        
    Write-Host "User created successfully: $email"
}

Write-Host "All users created successfully!"
