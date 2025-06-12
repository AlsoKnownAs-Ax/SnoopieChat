package pki_entity.Services;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import pki_entity.DBConnections.EnvStorageConnector;

import java.io.IOException;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.util.Date;

/**
 * Generate certificates
 */
public class CertificateGenerator {


    public static void initSecurityProvider() {
        Security.addProvider(new BouncyCastleProvider());
    }

    public static KeyPair generateKeyPair() throws NoSuchAlgorithmException, NoSuchProviderException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", "BC"); // use Bouncy Castle
        generator.initialize(2048); // key size (2048 is good)
        return generator.generateKeyPair();
    }

    public static X509Certificate generateCertificate(PublicKey userPublicKey, X500Name subjectName) throws OperatorCreationException,
            CertificateException, NoSuchAlgorithmException, InvalidKeySpecException, IOException, NoSuchProviderException {
        KeyPair issuerKeyPair = EnvStorageConnector.loadKeyPair();
        PrivateKey issuerPrivateKey = issuerKeyPair.getPrivate();
        X500Name issuer = EnvStorageConnector.getCaName();
        long now = System.currentTimeMillis();
        Date startDate = new Date(now);
        Date endDate = new Date(now + (365L * 24 * 60 * 60 * 1000)); // 1 year validity

        SecureRandom random = new SecureRandom();
        BigInteger serialNumber = new BigInteger(64, random);


        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                subjectName, serialNumber, startDate, endDate, issuer, userPublicKey
        );

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider("BC")
                .build(issuerPrivateKey);

        return new JcaX509CertificateConverter()
                .setProvider("BC")
                .getCertificate(certBuilder.build(signer));
    }
}
