package pki_entity.Util;

import java.io.ByteArrayInputStream;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class KeyUtil {
    public static String encodePublic(KeyPair keyPair) {
        return Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
    }

    public static String encodePrivate(KeyPair keyPair) {
        return Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
    }

    public static PublicKey stringToPublic(String publicKeyStr) throws Exception {
        System.out.println(publicKeyStr);
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(keyBytes));
    }

    public static String certToString(X509Certificate cert) throws Exception{
        return Base64.getEncoder().encodeToString(cert.getEncoded());
    }

    public static X509Certificate stringToCert(String certStr) throws Exception {
        byte[] certBytes = Base64.getDecoder().decode(certStr);
        return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(certBytes));
    }
}
