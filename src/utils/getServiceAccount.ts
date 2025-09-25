export default () => {
  return {
    type: import.meta.env["google-type"],
    project_id: import.meta.env["google-project_id"],
    private_key_id: import.meta.env["google-private_key_id"],
    private_key: import.meta.env["google-private_key"]?.replace(/\\n/g, "\n"),
    client_email: import.meta.env["google-client_email"],
    client_id: import.meta.env["google-client_id"],
    auth_uri: import.meta.env["google-auth_uri"],
    token_uri: import.meta.env["google-token_uri"],
    auth_provider_x509_cert_url: import.meta.env["google-auth_provider_x509_cert_url"],
    client_x509_cert_url: import.meta.env["google-client_x509_cert_url"],
    universe_domain: import.meta.env["google-universe_domain"],
  }
}