package pki_entity.DBConnections;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Connector to the certificate database
 */
public class PkiDBConnector {
    private static final String DB_URL = "jdbc:sqlite:pki.db";
    private static Connection conn;
//    private static final String schemaFilePath = "../pki-schema.sql"; // Path to your SQL schema file


    public static Connection connect() {
        if (conn != null)
            return conn;
        try {
            conn = DriverManager.getConnection(DB_URL);
            System.out.println("Connected to Certificate database.");
            return conn;
        } catch (SQLException e) {
            System.out.println("Connection failed: " + e.getMessage());
            return null;
        }
    }
}
