DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS revocations;

CREATE TABLE users (
    username TEXT PRIMARY KEY NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
    serial_number TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    certificate_bytes BLOB NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE revocations (
    serial_number TEXT PRIMARY KEY,
    revocation_date DATETIME NOT NULL,
    reason TEXT,
    FOREIGN KEY (serial_number) REFERENCES certificates(serial_number)
);

CREATE TABLE x3dh_keys (
    username TEXT PRIMARY KEY,
    identity_public_key TEXT, -- Stored on registration
    signed_prekey TEXT,   -- Stored on register
    signed_prekey_signature TEXT, 
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
);

-- Create a trigger to update the timestamp when a record changes
CREATE TRIGGER update_x3dh_keys_timestamp 
AFTER UPDATE ON x3dh_keys
FOR EACH ROW
BEGIN
    UPDATE x3dh_keys SET generated_at = CURRENT_TIMESTAMP 
    WHERE username = NEW.username;
END;