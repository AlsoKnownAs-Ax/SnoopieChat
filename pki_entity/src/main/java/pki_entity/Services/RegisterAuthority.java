package pki_entity.Services;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PublicKey;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.sql.SQLException;

import org.bouncycastle.operator.OperatorCreationException;
import pki_entity.DBConnections.EnvStorageConnector;
import pki_entity.DBConnections.UserDBConnector;
import pki_entity.Exceptions.ForbiddenActionException;
import pki_entity.Exceptions.ResourceNotFoundException;
import pki_entity.Exceptions.UserValidationFailedException;

//uses java.security class, but we can define keys and certificates also manually,idk

/**
 * This class connects with the ca and registers, fetches certificates.
 */
public class RegisterAuthority {
    private CertificateAuthority ca;

    public RegisterAuthority(CertificateAuthority ca) {
        this.ca = ca;
    }

    public X509Certificate register(String username, String password, PublicKey publicKey) throws SQLException, CertificateException, CertificateEncodingException, ForbiddenActionException, UserValidationFailedException, NoSuchAlgorithmException, IOException, InvalidKeySpecException, NoSuchProviderException, OperatorCreationException {
        if(!UserDBConnector.verifyUser(username,password))throw new UserValidationFailedException("User verification failed");
        ca.register(username, publicKey);
        return EnvStorageConnector.loadCertificate();
    }

    public void revoke(String username,String password, String reason) throws UserValidationFailedException,SQLException, ResourceNotFoundException, CertificateException {
        if(!UserDBConnector.verifyUser(username,password))throw new UserValidationFailedException("User verification failed");
        ca.revokeCertificate(username, reason);
    }


}
