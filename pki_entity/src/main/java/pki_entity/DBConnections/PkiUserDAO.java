package pki_entity.DBConnections;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

//Will add more functionality as we start interacting with the PKI

/**
 * UserDAO class for managing user data in the database.
 * It provides methods to insert, delete, and print user information.
 */
public class PkiUserDAO {
    private final Connection conn;

    public PkiUserDAO(Connection conn) {
        this.conn = conn;
    }

    public boolean insertUser(String username, String publicKey) throws SQLException {
        String sql = "INSERT INTO users (username, public_key) VALUES (?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            stmt.setString(2, publicKey);
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deleteUser(String username) throws SQLException {
        String sql = "DELETE FROM users WHERE username = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            return stmt.executeUpdate() > 0;
        }
    }

    public void printUser(String username) throws SQLException {
        String sql = "SELECT * FROM users WHERE username = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                System.out.println("ID: " + rs.getString("username"));
                System.out.println("Key: " + rs.getString("public_key"));
            } else {
                System.out.println("User not found.");
            }
        }
    }

    public boolean userExists(String username) throws SQLException {
        String sql = "SELECT username FROM users WHERE username = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return true;
            } else {
                return false;
            }
        }
    }
}
