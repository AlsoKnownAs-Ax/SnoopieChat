package pki_entity.Services;

import pki_entity.DBConnections.PkiCertificateDAO;
import pki_entity.Exceptions.ResourceNotFoundException;

import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.sql.SQLException;

/**
 * Check validity of certificates
 */
public class VerificationAuthority {
    private PkiCertificateDAO certificateDAO;

    public VerificationAuthority(PkiCertificateDAO pkiCertificateDAO) {
        this.certificateDAO = pkiCertificateDAO;
    }

    public X509Certificate fetchValidCertificate(String username) throws SQLException, ResourceNotFoundException, CertificateException {
        return certificateDAO.fetchValidCertificate(username);
    }

    public boolean isValidCertificate(X509Certificate cert) throws SQLException, CertificateException {
        return certificateDAO.validateCert(cert);
    }
}
