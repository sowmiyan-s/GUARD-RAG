# Security Policy

## Reporting Security Vulnerabilities

**Please do not open public GitHub issues for security vulnerabilities.**

Instead, please report security vulnerabilities to **sowmisowmiyan58@gmail.com** with the following details:

1. Type of vulnerability (e.g., XSS, SQL Injection, RCE, etc.)
2. Affected component(s)
3. Description and proof-of-concept
4. Potential impact
5. Suggested fix (if available)

We take security seriously and will:
- Acknowledge your report within 48 hours
- Provide a timeline for a fix
- Keep you updated on progress
- Credit you in the security advisory (if desired)

## Security Features

### Built-in Protections

- **4-Tier Safety Guardrails**: Configurable security levels with PII redaction and credential masking
- **Offline Operation**: No data transmitted to external services
- **Prompt Injection Defense**: Sanitization of ingested documents
- **Credential Blocking**: Prevents exposure of API keys, tokens, passwords
- **Anti-Jailbreak**: Defense against prompt manipulation attacks
- **Audit Logging**: Complete audit trail of all operations
- **Encryption Ready**: Support for encrypted data storage (user-configured)

### Deployment Security

- Run with minimal privileges (non-root Docker container)
- Use environment variables for secrets (never hardcode)
- Enable HTTPS/TLS in production
- Implement API key authentication
- Use network isolation (firewall rules)
- Regular dependency updates
- SBOM (Software Bill of Materials) available

## Supported Versions

Security updates will be provided for:

| Version | Status | Support Until |
| :--- | :--- | :--- |
| 1.3.x | ✅ Active | 2026-12-31 |
| 1.2.x | ⚠️ Limited | 2026-09-30 |
| < 1.2 | ❌ Unsupported | N/A |

## Security Best Practices

### For Users

1. **Keep GuardRAG Updated**
   ```bash
   pip install --upgrade guard-rag
   ```

2. **Use Strong API Keys**
   ```bash
   export GUARDRAG_API_KEY="$(openssl rand -hex 32)"
   ```

3. **Enable HTTPS in Production**
   - Use nginx/Apache with SSL certificates
   - Never expose over plain HTTP

4. **Restrict Access**
   - Use firewall rules to limit network access
   - Run on private networks when possible
   - Use authentication for sensitive endpoints

5. **Regular Backups**
   ```bash
   tar -czf guardrag_backup.tar.gz /data/
   ```

6. **Monitor Audit Logs**
   - Review logs regularly
   - Set up alerts for suspicious activity
   - Archive logs for compliance

### For Developers

1. **Validate Input**
   - Sanitize all user input
   - Use type hints and validation
   - Never trust external data

2. **Dependencies**
   - Keep dependencies updated
   - Use `pip-audit` to check for vulnerabilities
   ```bash
   pip-audit
   ```

3. **Testing**
   - Write security-focused tests
   - Use SAST tools
   - Perform code reviews

4. **Secrets Management**
   - Never commit secrets
   - Use `.env` files (never commit)
   - Rotate credentials regularly

## Known Vulnerabilities

None currently known. If you discover one, please follow the reporting process above.

## Security Updates Timeline

- **Critical**: Patched within 24 hours
- **High**: Patched within 7 days
- **Medium**: Patched within 30 days
- **Low**: Included in next release

## Compliance

GuardRAG is designed to support:

- ✅ GDPR compliance (data privacy)
- ✅ HIPAA compliance (healthcare data)
- ✅ SOC 2 Type II readiness
- ✅ Data residency requirements
- ✅ Offline-first architecture

## Third-Party Security Audits

We welcome independent security audits. Please contact us at sowmisowmiyan58@gmail.com to discuss audit arrangements.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE List](https://cwe.mitre.org/)
- [CVE Database](https://cve.mitre.org/)
- [Ollama Security](https://github.com/ollama/ollama/security)

---

**Thank you for helping keep GuardRAG secure!** 🛡️
