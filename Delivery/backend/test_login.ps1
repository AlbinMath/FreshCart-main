try {
    $response = Invoke-RestMethod -Uri "http://localhost:5007/api/delivery-agent/login" -Method Post -ContentType "application/json" -Body '{"email": "test@example.com", "password": "wrongpassword"}'
    Write-Output $response
} catch {
    Write-Output "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Output "Body: $($_.ErrorDetails.Message)"
    $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
    $responseBody = $reader.ReadToEnd()
    Write-Output "Response Body: $responseBody"
}
