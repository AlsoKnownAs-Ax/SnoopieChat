package pki_entity.Services;

import org.bouncycastle.operator.OperatorCreationException;
import pki_entity.DBConnections.PkiCertificateDAO;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PublicKey;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.sql.SQLException;

import org.bouncycastle.asn1.x500.X500Name;
import pki_entity.Exceptions.ForbiddenActionException;
import pki_entity.Exceptions.ResourceNotFoundException;

public class CertificateAuthority {
    private PkiCertificateDAO certificateDAO;

    /**
     * * Constructor for CertificateAuthority. It generates a key pair and a
     * self-signed certificate.
     * The certificate is generated using the Bouncy Castle library.
     */
    public CertificateAuthority(PkiCertificateDAO certificateDAO) {
        this.certificateDAO = certificateDAO;
    }

    public void register(String username, PublicKey publicKey) throws SQLException, CertificateException, CertificateEncodingException, ForbiddenActionException, NoSuchAlgorithmException, InvalidKeySpecException, IOException, OperatorCreationException, NoSuchProviderException {
        X500Name subjectName = new X500Name("CN=" + username + ", O=SnoopieChatLtd, C=Netherlands");
        X509Certificate cert = CertificateGenerator.generateCertificate(publicKey, subjectName);
        certificateDAO.insertCertificate(username, cert.getSerialNumber().toString(), cert);
    }

    public void revokeCertificate(String username, String reason) throws SQLException, ResourceNotFoundException, CertificateException {
        certificateDAO.revokeCertificate(username, reason);
    }
}