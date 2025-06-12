package pki_entity.DBConnections;

import io.github.cdimascio.dotenv.Dotenv;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.operator.OperatorCreationException;
import pki_entity.Services.CertificateGenerator;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public class EnvStorageConnector {
    private static final String ENV_FILE_PATH = ".env";
    private static final String PUBLIC_KEY_VAR = "PUBLIC_KEY";
    private static final String PRIVATE_KEY_VAR = "PRIVATE_KEY";
    private static final String CERTIFICATE_VAR = "X509_CERTIFICATE";
    private static final X500Name caName = new X500Name("CN=SnoopieCA, O=SnoopieChatLtd, C=Netherlands");


    // Load KeyPair
    public static KeyPair loadKeyPair() throws NoSuchAlgorithmException, InvalidKeySpecException, CertificateException,
            IOException, NoSuchProviderException, OperatorCreationException {
        Dotenv dotenv = Dotenv.load();

        String publicKey = dotenv.get(PUBLIC_KEY_VAR);
        String privateKey = dotenv.get(PRIVATE_KEY_VAR);
        if (publicKey == null || privateKey == null) {
            initializeKeys();
            publicKey = dotenv.get(PUBLIC_KEY_VAR);
            privateKey = dotenv.get(PRIVATE_KEY_VAR);
        }

        byte[] pubBytes = Base64.getDecoder().decode(publicKey);
        byte[] privBytes = Base64.getDecoder().decode(privateKey);

        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey pubKey = keyFactory.generatePublic(new X509EncodedKeySpec(pubBytes));
        PrivateKey privKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privBytes));

        return new KeyPair(pubKey, privKey);
    }

    // Load Certificate
    public static X509Certificate loadCertificate() throws CertificateException, NoSuchAlgorithmException, IOException,
            InvalidKeySpecException, NoSuchProviderException, OperatorCreationException {
        Dotenv dotenv = Dotenv.load();
        String certBase64 = dotenv.get(CERTIFICATE_VAR);
        if (certBase64 == null) {
            initializeKeys();
            certBase64 = dotenv.get(CERTIFICATE_VAR);
        }

        byte[] certBytes = Base64.getDecoder().decode(certBase64);
        CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
        return (X509Certificate) certFactory.generateCertificate(new java.io.ByteArrayInputStream(certBytes));
    }

    public static X500Name getCaName() {
        return caName;
    }

    // Store KeyPair
    private static void storeKeyPair(KeyPair keyPair) throws IOException {
        String publicKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
        String privateKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());

        updateEnv(Map.of(
                PUBLIC_KEY_VAR, publicKeyBase64,
                PRIVATE_KEY_VAR, privateKeyBase64
        ));
    }

    // Store Certificate (X.509)
    private static void storeCertificate(X509Certificate certificate) throws CertificateEncodingException, IOException {
        String certBase64 = Base64.getEncoder().encodeToString(certificate.getEncoded());
        updateEnv(Map.of(CERTIFICATE_VAR, certBase64));
    }

    // Utility to update .env file safely
    private static void updateEnv(Map<String, String> newValues) throws IOException {
        Map<String, String> env = new LinkedHashMap<>();

        // Load existing values
        Path path = Paths.get(ENV_FILE_PATH);
        if (Files.exists(path)) {
            for (String line : Files.readAllLines(path)) {
                if (line.contains("=")) {
                    String[] parts = line.split("=", 2);
                    env.put(parts[0].trim(), parts[1].trim());
                }
            }
        }

        // Add or overwrite
        env.putAll(newValues);

        // Write back
        try (FileWriter writer = new FileWriter(ENV_FILE_PATH)) {
            for (Map.Entry<String, String> entry : env.entrySet()) {
                writer.write(entry.getKey() + "=" + entry.getValue() + "\n");
            }
        }
    }

    private static void initializeKeys() throws NoSuchAlgorithmException, NoSuchProviderException, CertificateException,
            OperatorCreationException, IOException, InvalidKeySpecException {
        KeyPair pair = CertificateGenerator.generateKeyPair();
        storeKeyPair(pair);
        X509Certificate cert = CertificateGenerator.generateCertificate(pair.getPublic(), caName);
        storeCertificate(cert);
    }
}
