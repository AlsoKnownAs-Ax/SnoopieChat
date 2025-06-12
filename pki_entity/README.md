# 📜 PKI Setup Process

This file explains the steps to set up the PKI server on a local machine.
> ⚠️ **Important Note:**  
> The PKI server will work only on a local network, since we do not configure external router proxies.

---

# 🛠 Process

We run the PKI service using the **Javalin** framework.  
This framework allows us to expose the necessary API endpoints.

## 📡 Available Endpoints:

- `GET /register`:  
  Generates a signed certificate for a new user and registers them in the certificate database.  
  **Arguments:** `username`, `password`, `publicKey`.

- `GET /revoke`:  
  Revokes a certificate of an existing user.  
  **Arguments:** `username`, `password`.

- `GET /fetch`:  
  Fetches a certificate of a user from the database.  
  **Arguments:** `subject`.

- `POST /validate`:  
  Checks the validity of a given certificate.  
  **Arguments:** `cert`.

---

# ⚙️ Setup Instructions

## 1. Install OpenSSL

- Download and install OpenSSL from: [https://slproweb.com/products/Win32OpenSSL.html](https://slproweb.com/products/Win32OpenSSL.html)
- Choose **"Win64 OpenSSL v3.5.0"** during installation.

## 2. Add OpenSSL to PATH

- Add the OpenSSL `bin` folder to your Windows system PATH. Example:

  `C:\Program Files\OpenSSL-Win64\bin`

## 3. Generate a Self-Signed Certificate

- Open **Command Prompt (CMD)** and run:

  `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout selfsigned.key -out selfsigned.crt`

- When prompted for details, fill them out.  
  **Important:** When asked for **Common Name (e.g., domain name)**, enter your **local IP address**.

  Example:

  `Common Name (e.g., domain name): 172.31.176.1`

## 4. Move Certificate Files

- Locate `selfsigned.crt` and `selfsigned.key`.
- Move them to a known folder **outside the Git project** for easier path management.

## 5. Install NGINX

- Download and extract NGINX from: [https://nginx.org/en/download.html](https://nginx.org/en/download.html)
- Move the extracted folder (e.g., `nginx-1.28.0`) from Downloads to a more stable location like `C:\nginx\`.

## 6. Configure NGINX

- Copy the file:

  `team01\pki_entity\nginx.conf`

  to:

  `nginx\conf\`

- Edit the copied `nginx.conf`:
    - Replace `server_name` with your IP:

      `server_name your_ip;`

    - Replace paths to your certificate and key:

      `ssl_certificate "path_to_certificate/selfsigned.crt";`

      `ssl_certificate_key "path_to_key/selfsigned.key";`

## 7. Test NGINX Configuration

- In CMD, navigate to your NGINX folder and run:

  `nginx.exe -t`

✅ This should verify that the configuration is correct.

## 8. Start NGINX

- Run:

  `start nginx.exe`

✅ NGINX will now proxy HTTPS traffic to your local Javalin server.

## 9. Run the PKI Application

- Open your IDE (e.g., IntelliJ) or CMD, and **run `Main.java`** to start the Javalin server.

## 10. Restart Nginx
- If needed restart the nginx process.
nginx -s quit
---
