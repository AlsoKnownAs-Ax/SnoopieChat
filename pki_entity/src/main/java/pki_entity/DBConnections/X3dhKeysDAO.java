package pki_entity.DBConnections;

import pki_entity.Exceptions.ResourceNotFoundException;
import pki_entity.Models.X3dhKeyBundle;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

public class X3dhKeysDAO {
    private Connection connection;
    private PkiUserDAO userDAO;

    public X3dhKeysDAO(Connection connection, PkiUserDAO userDAO) {
        this.connection = connection;
        this.userDAO = userDAO;
    }

    public void storeX3dhKeys(String username, String signedPrekey, String signature) throws SQLException {
        // Check if user exists
        if (!userDAO.userExists(username)) {
            throw new SQLException("User does not exist");
        }

        // Check if keys already exist for this user
        String checkSql = "SELECT username FROM x3dh_keys WHERE username = ?";
        try (PreparedStatement stmt = connection.prepareStatement(checkSql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                // Update existing keys
                String updateSql = "UPDATE x3dh_keys SET identity_public_key = ?, signed_prekey = ?, signed_prekey_signature = ?, generated_at = CURRENT_TIMESTAMP WHERE username = ?";
                try (PreparedStatement updateStmt = connection.prepareStatement(updateSql)) {
                    updateStmt.setString(2, signedPrekey);
                    updateStmt.setString(3, signature);
                    updateStmt.setString(4, username);
                    updateStmt.executeUpdate();
                }
            } else {
                // Insert new keys
                String insertSql = "INSERT INTO x3dh_keys (username, identity_public_key, signed_prekey, signed_prekey_signature) VALUES (?, ?, ?, ?)";
                try (PreparedStatement insertStmt = connection.prepareStatement(insertSql)) {
                    insertStmt.setString(1, username);
                    insertStmt.setString(3, signedPrekey);
                    insertStmt.setString(4, signature);
                    insertStmt.executeUpdate();
                }
            }
        }
    }

    public X3dhKeyBundle getX3dhKeys(String username) throws SQLException, ResourceNotFoundException {
        String sql = "SELECT * FROM x3dh_keys WHERE username = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                X3dhKeyBundle bundle = new X3dhKeyBundle();
                bundle.setUsername(rs.getString("username"));
                bundle.setIdentityPublicKey(rs.getString("identity_public_key"));
                bundle.setSignedPrekey(rs.getString("signed_prekey"));
                bundle.setSignedPrekeySignature(rs.getString("signed_prekey_signature"));
                bundle.setGeneratedAt(rs.getObject("generated_at", LocalDateTime.class));
                return bundle;
            } else {
                throw new ResourceNotFoundException("X3DH keys not found for user: " + username);
            }
        }
    }

    public void storePreKeyBundle(String username, String signature, String createdAt, String prekeyJwk) throws SQLException {
        // Check if user exists
        if (!userDAO.userExists(username)) {
            throw new SQLException("User does not exist");
        }

        // Check if keys already exist for this user
        String checkSql = "SELECT username FROM x3dh_keys WHERE username = ?";
        try (PreparedStatement stmt = connection.prepareStatement(checkSql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                // Update existing keys
                String updateSql = "UPDATE x3dh_keys SET signed_prekey_signature = ?, signed_prekey = ?, generated_at = ? WHERE username = ?";
                try (PreparedStatement updateStmt = connection.prepareStatement(updateSql)) {
                    updateStmt.setString(1, signature);
                    updateStmt.setString(2, prekeyJwk);
                    updateStmt.setString(3, createdAt);
                    updateStmt.setString(4, username);
                    updateStmt.executeUpdate();
                }
            } else {
                throw new SQLException("User not found in the x3dh keys table");
            }
        }
    }

    public void uploadIdentityPublicKey(String username, String identityPublicKey) throws SQLException {
        // Check if user exists
        if (!userDAO.userExists(username)) {
            throw new SQLException("User does not exist");
        }

        // Check if keys already exist for this user
        String checkSql = "SELECT username FROM x3dh_keys WHERE username = ?";
        try (PreparedStatement stmt = connection.prepareStatement(checkSql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                // Prevent updates
                throw new SQLException("Username already has a identity Public Key. Update is forbidden.");
            } else {
                String insertSql = "INSERT INTO x3dh_keys (username, identity_public_key, signed_prekey, signed_prekey_signature) VALUES (?, ?, '', '')";
                try (PreparedStatement insertStmt = connection.prepareStatement(insertSql)) {
                    insertStmt.setString(1, username);
                    insertStmt.setString(2, identityPublicKey);
                    insertStmt.executeUpdate();
                }
            }
        }
    }
}