package pki_entity.Controller;

import io.javalin.Javalin;
import pki_entity.DBConnections.*;
import pki_entity.Exceptions.ResourceNotFoundException;
import pki_entity.Models.JavalinCertResponse;
import pki_entity.Models.JavalinValidationResponse;
import pki_entity.Models.JavalinX3dhResponse;
import pki_entity.Models.X3dhKeyBundle;
import pki_entity.Services.CertificateAuthority;
import pki_entity.Services.CertificateGenerator;
import pki_entity.Services.RegisterAuthority;
import pki_entity.Services.VerificationAuthority;
import pki_entity.Services.X3dhService;
import pki_entity.Util.KeyUtil;

import java.security.*;
import java.security.cert.X509Certificate;

public class Main {
    public static Javalin app;
    private static RegisterAuthority registerAuthority;
    private static VerificationAuthority verificationAuthority;
    private static X3dhService x3dhService;

    /**
     * Main method to start the PKI service.
     * It initializes the security provider and starts the Javalin server.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        initializeApp();

        app = Javalin.create(config -> {
            config.http.defaultContentType = "application/json";
        }).start(7000);
        app.get("/health", ctx -> ctx.result("PKI Service is running"));
        app.post("/register", ctx -> {
            String username = ctx.formParam("username");
            String password = ctx.formParam("password");
            String publicKeyStr = ctx.formParam("public_key");
            if (username == null || publicKeyStr == null || password == null) {
                ctx.status(400).result("Missing username, password or publicKey parameter");
                return;
            }
            PublicKey publicKey = KeyUtil.stringToPublic(publicKeyStr);
            X509Certificate cert = null;
            try {
                cert = registerAuthority.register(username, password, publicKey);
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
                return;
            }

            String certStr = KeyUtil.certToString(cert);
            JavalinCertResponse certResponse = new JavalinCertResponse(certStr);
            ctx.json(certResponse);
        });
        app.get("/revoke", ctx -> {
            String username = ctx.queryParam("username");
            String password = ctx.queryParam("password");
            String reason = ctx.queryParam("reason");
            if (username == null || password == null || reason == null) {
                ctx.status(400).result("Missing username, password or reason parameter");
                return;
            }
            try {
                registerAuthority.revoke(username, password, reason);
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
                return;
            }
            ctx.result("Certificate revoked successfully");
        });
        app.get("/fetch", ctx -> {
            String username = ctx.queryParam("username");
            if (username == null) {
                ctx.status(400).result("Missing username parameter");
                return;
            }
            JavalinCertResponse certResponse = null;
            try {
                X509Certificate cert = verificationAuthority.fetchValidCertificate(username);
                String certStr = KeyUtil.certToString(cert);
                certResponse = new JavalinCertResponse(certStr);
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
            }

            ctx.json(certResponse);
        });
        app.get("/validate", ctx -> {
            String certStr = ctx.queryParam("cert");
            if (certStr == null) {
                ctx.status(400).result("Missing cert parameter");
                return;
            }
            X509Certificate cert = KeyUtil.stringToCert(certStr);
            boolean isValid = false;
            try {
                isValid = verificationAuthority.isValidCertificate(cert);
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
            }
            ctx.json(new JavalinValidationResponse(isValid));
        });

        app.post("/x3dh/upload/identityPublicKey", ctx -> {
            String identityPublicKey = ctx.formParam("identityPublicKey");
            String username = ctx.formParam("username");

            System.out.println("Identity Public key: " + identityPublicKey);
            System.out.println("username: " + username);

            if (identityPublicKey == null || username == null) {
                ctx.status(400).result("Missing required parameters");
                return;
            }

            try {
                x3dhService.uploadIdentityPublicKey(username, identityPublicKey);
                ctx.status(200).result("X3DH keys uploaded successfully");
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
            }
        });

        app.post("/x3dh/upload", ctx -> {
            String username = ctx.formParam("username");
            String password = ctx.formParam("password");
            String signedPrekey = ctx.formParam("signed_prekey");
            String signature = ctx.formParam("signature");
            
            if (username == null || password == null ||
                signedPrekey == null || signature == null) {
                ctx.status(400).result("Missing required parameters");
                return;
            }
            
            try {
                x3dhService.uploadX3dhKeys(username, password, signedPrekey, signature);
                ctx.status(200).result("X3DH keys uploaded successfully");
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
            }
        });

        app.get("/x3dh/fetch", ctx -> {
            String username = ctx.queryParam("username");
            if (username == null) {
                ctx.status(400).result("Missing username parameter");
                return;
            }
            
            try {
                X3dhKeyBundle bundle = x3dhService.getX3dhKeys(username);
                ctx.json(new JavalinX3dhResponse(
                    bundle.getIdentityPublicKey(),
                    bundle.getSignedPrekey(),
                    bundle.getSignedPrekeySignature()
                ));
            } catch (ResourceNotFoundException e) {
                ctx.status(404).result(e.getMessage());
            } catch (Exception e) {
                ctx.status(400).result(e.getMessage());
            }
        });
        app.get("/test", ctx -> {
            String test = ctx.queryParam("test");
            if (test == null) {
                ctx.status(400).result("Missing test parameter");
                return;
            }
            ctx.result("Test parameter: " + test);
        });
    }

    private static void initializeApp() {
        CertificateGenerator.initSecurityProvider();
        PkiUserDAO pkiUserDAO = new PkiUserDAO(PkiDBConnector.connect());
        PkiCertificateDAO pkiCertificateDAO = new PkiCertificateDAO(PkiDBConnector.connect(), pkiUserDAO);
        X3dhKeysDAO x3dhKeysDAO = new X3dhKeysDAO(PkiDBConnector.connect(), pkiUserDAO);
        CertificateAuthority ca = new CertificateAuthority(pkiCertificateDAO);
        verificationAuthority = new VerificationAuthority(pkiCertificateDAO);
        registerAuthority = new RegisterAuthority(ca);
        x3dhService = new X3dhService(x3dhKeysDAO);
    }
}
