curl -s "https://$SERVICE_SUBDOMAIN.$SERVICE_DOMAIN/self-test-render" -H "Authorization: Bearer $JWT_SECRET" | jq

