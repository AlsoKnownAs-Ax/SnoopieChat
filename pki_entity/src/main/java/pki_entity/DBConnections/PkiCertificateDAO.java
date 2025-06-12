package pki_entity.DBConnections;

import pki_entity.Exceptions.ForbiddenActionException;
import pki_entity.Exceptions.ResourceNotFoundException;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PkiCertificateDAO {
    private final Connection conn;
    private final String certificatesTableName = "certificates";
    private final String revocationsTableName = "revocations";
    private final String usersTableName = "users";
    private final PkiUserDAO userDAO;

    public PkiCertificateDAO(Connection conn, PkiUserDAO userDAO) {
        this.userDAO = userDAO;
        this.conn = conn;
    }

    public void insertCertificate(String username, String serialNumber, X509Certificate cert)
            throws SQLException, CertificateEncodingException, ForbiddenActionException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }
        // Get user_id from username
        String fetchUserQuery = "SELECT * FROM " + usersTableName + " WHERE username = ?";
        try (PreparedStatement getUserStmt = conn.prepareStatement(fetchUserQuery)) {
            getUserStmt.setString(1, username);
            ResultSet rs = getUserStmt.executeQuery();
            if (!rs.next()) {
                userDAO.insertUser(username, cert.getPublicKey().toString());
            }
        }
        X509Certificate existingCert = null;
        try {
            existingCert = fetchValidCertificate(username);
        } catch (Exception ignored) {
        }
        if (existingCert != null)
            throw new ForbiddenActionException("Certificate already exists");

        // Insert certificate using username
        byte[] certBytes = cert.getEncoded();
        String insertCertSql = "INSERT INTO " + certificatesTableName
                + " (serial_number, username, certificate_bytes) VALUES (?, ?, ?)";
        PreparedStatement insertCertStmt = conn.prepareStatement(insertCertSql);
        insertCertStmt.setString(1, serialNumber);
        insertCertStmt.setString(2, username);
        insertCertStmt.setBytes(3, certBytes);
        insertCertStmt.executeUpdate();
    }

//    public boolean deleteCertificate(String username) throws PkiDBException {
//
//        String sql = "DELETE FROM " + certificatesTableName + " WHERE username = ?";
//        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
//            pstmt.setString(1, username);
//            pstmt.executeUpdate();
//            return true;
//        } catch (Exception e) {
//            throw new PkiDBException("Certificate deletion failed: " + e.getMessage());
//        }
//    }

    public void revokeCertificate(String username, String reason) throws SQLException, ResourceNotFoundException, CertificateException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }
        // Check if the cert exists
        X509Certificate cert = null;
        cert = fetchValidCertificate(username);
        String sql = "INSERT INTO " + revocationsTableName + " (serial_number, revocation_date, reason) " +
                "SELECT ?, CURRENT_TIMESTAMP, ? ";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setString(1, cert.getSerialNumber().toString());
        pstmt.setString(2, reason);
        pstmt.executeUpdate();
    }

    public X509Certificate fetchValidCertificate(String username) throws SQLException, ResourceNotFoundException, CertificateException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }

        String sql = "SELECT certificate_bytes FROM " + certificatesTableName + " WHERE username = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setString(1, username);
        ResultSet rs = pstmt.executeQuery();
        X509Certificate cert = null;
        boolean isExpired = false;
        boolean isRevoked = false;
        while (rs.next()) {
            byte[] certBytes = rs.getBytes("certificate_bytes");
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            cert = (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(certBytes));
            if (isExpired(cert))
                isExpired = true;
            else if (isRevoked(cert))
                isRevoked = true;
            else
                return cert;
        }
        String error = "No valid certificate found: " + (isRevoked || isExpired ? (isRevoked ? "Revoked certificate found " : "")
                + (isExpired ? "Expired certificate found" : "") : "Certificate not found");

        throw new ResourceNotFoundException(error);

    }

    public boolean validateCert(X509Certificate cert) throws SQLException, CertificateException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }

        String sql = "SELECT certificate_bytes FROM " + certificatesTableName + " WHERE serial_number = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setString(1, cert.getSerialNumber().toString());
        ResultSet rs = pstmt.executeQuery();
        while (rs.next()) {
            byte[] certBytes = rs.getBytes("certificate_bytes");
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate foundCert = (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(certBytes));
            if (isExpired(foundCert) || isRevoked(foundCert))
                continue;
            return true;
        }
        return false;
    }

    public boolean isRevoked(X509Certificate cert) throws SQLException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }

        String serialNumber = cert.getSerialNumber().toString(); // get serial as String
        String sql = "SELECT 1 FROM " + revocationsTableName + " WHERE serial_number = ?";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, serialNumber);
            ResultSet rs = pstmt.executeQuery();
            return rs.next(); // true if found (revoked), false otherwise
        }
    }

    public boolean isExpired(X509Certificate cert) throws SQLException {
        if (conn == null) {
            throw new SQLException("PKI DB Connection failed");
        }
        return (cert.getNotAfter().before(new java.util.Date()));
    }

}
