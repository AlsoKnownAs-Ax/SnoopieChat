package pki_entity.Controller;

import io.javalin.Javalin;
import pki_entity.DBConnections.PkiCertificateDAO;
import pki_entity.DBConnections.PkiDBConnector;
import pki_entity.DBConnections.PkiUserDAO;
import pki_entity.Exceptions.ForbiddenActionException;
import pki_entity.Exceptions.ResourceNotFoundException;
import pki_entity.Exceptions.UserValidationFailedException;
import pki_entity.Models.JavalinCertResponse;
import pki_entity.Models.JavalinValidationResponse;
import pki_entity.Services.*;
import pki_entity.Util.GsonMapper;
import pki_entity.Util.KeyUtil;

import java.security.PublicKey;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.sql.SQLException;

public class TestingMain {
    public static Javalin app;
    private static RegisterAuthority registerAuthority;
    private static VerificationAuthority verificationAuthority;

    /**
     * Main method to start the PKI service.
     * It initializes the security provider and starts the Javalin server.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        initializeApp();
// Configure Gson as the JSON mapper

        app = Javalin.create(config -> {
            config.jsonMapper(new GsonMapper());
            config.http.defaultContentType = "application/json";
        }).start(7000);
//        System.out.println("Using JavalinJackson mapper: " + new JavalinJackson().getMapper());

        app.get("/", ctx -> ctx.result("PKI Service is running"));
        app.get("/register", ctx -> {
            String username = ctx.queryParam("username");
            String password = ctx.queryParam("password");
            String publicKeyStr = ctx.queryParam("public_key");
            if (username == null || publicKeyStr == null || password == null) {
                ctx.status(400).result("\"Missing parameters, User: \"+ (username==null)+\" Password: \"+(password==null)+\" Public key: \"+(publicKeyStr==null)");
                throw new Exception("Missing parameters, User: " + (username == null) + " Password: " + (password == null) + " Public key: " + (publicKeyStr == null));
            }
            PublicKey publicKey = KeyUtil.stringToPublic(publicKeyStr);
            X509Certificate cert = null;
            try {
                cert = registerAuthority.register(username, password, publicKey);
            } catch (CertificateEncodingException e) {
                ctx.status(400).result("Registration failed: " + e.getMessage());
                throw e;
            } catch (SQLException | CertificateException e) {
                ctx.status(500).result("Registration failed: " + e.getMessage());
                throw e;
            } catch (UserValidationFailedException e) {
                ctx.status(401).result("Registration failed: " + e.getMessage());
                throw e;
            } catch (ForbiddenActionException e) {
                ctx.status(403).result("Registration failed: " + e.getMessage());
                throw e;
            } catch (Exception e) {
                ctx.status(500).result("Registration failed: " + e.getMessage());
                throw e;
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
                throw new Exception("Missing username, password or reason parameter");
            }
            try {
                registerAuthority.revoke(username, password, reason);
            } catch (UserValidationFailedException e) {
                ctx.status(401).result("Revocation failed: " + e.getMessage());
                throw e;
            } catch (SQLException | CertificateException e) {
                ctx.status(500).result("Revocation failed: " + e.getMessage());
                throw e;
            } catch (ResourceNotFoundException e) {
                ctx.status(404).result("Revocation failed: " + e.getMessage());
                throw e;
            }
            ctx.result("Certificate revoked successfully");
        });
        app.get("/fetch", ctx -> {
            String username = ctx.queryParam("username");
            if (username == null) {
                ctx.status(400).result("Missing username parameter");
                throw new Exception("Missing username parameter");
            }
            JavalinCertResponse certResponse = null;
            try {
                X509Certificate cert = verificationAuthority.fetchValidCertificate(username);
                String certStr = KeyUtil.certToString(cert);
                certResponse = new JavalinCertResponse(certStr);

            } catch (SQLException | CertificateException e) {
                ctx.status(500).result("Fetching failed: " + e.getMessage());
                throw e;
            } catch (ResourceNotFoundException e) {
                ctx.status(404).result("Fetching failed: " + e.getMessage());
                throw e;
            }

            ctx.json(certResponse);
        });
        app.get("/validate", ctx -> {
            String certStr = ctx.queryParam("cert");
            if (certStr == null) {
                ctx.status(400).result("Missing cert parameter");
                throw new Exception("Missing cert parameter");
            }
            X509Certificate cert = KeyUtil.stringToCert(certStr);
            boolean isValid = false;
            try {
                isValid = verificationAuthority.isValidCertificate(cert);
            } catch (SQLException | CertificateException e) {
                ctx.status(500).result("Validation failed: " + e.getMessage());
                throw e;
            }
            ctx.json(new JavalinValidationResponse(isValid));
        });
        app.get("/test", ctx -> {
            String test = ctx.queryParam("test");
            if (test == null) {
                ctx.status(400).result("Missing test parameter");
                throw new Exception("Missing test parameter");
            }
            ctx.result("Test parameter: " + test);
        });
    }

    private static void initializeApp() {
        CertificateGenerator.initSecurityProvider();
        PkiUserDAO pkiUserDAO = new PkiUserDAO(PkiDBConnector.connect());
        PkiCertificateDAO pkiCertificateDAO = new PkiCertificateDAO(PkiDBConnector.connect(), pkiUserDAO);
        CertificateAuthority ca = new CertificateAuthority(pkiCertificateDAO);
        verificationAuthority = new VerificationAuthority(pkiCertificateDAO);
        registerAuthority = new RegisterAuthority(ca);
    }
}
