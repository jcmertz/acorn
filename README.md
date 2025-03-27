# acorn
Acorn is a piece of Open Source Venue Management Software being developed for The Fallen Log at Kitchen 17!

# Configuring NGINX with Certbot

Copy, rename, and edit the following files

- nginx-certbot.env
  - CERTBOT_EMAIL
  - CERTBOT_AUTHENTICATOR
- nginx.conf
  - server_name
  - ssl_certificate 
  - ssl_certificate_key
- cloudflare.ini
  - dns_cloudflare_api_token