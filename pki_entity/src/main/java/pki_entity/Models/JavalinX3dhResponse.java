package pki_entity.Models;

public class JavalinX3dhResponse {
    private String identityKey;
    private String signedPrekey;
    private String signature;

    public JavalinX3dhResponse(String identityKey, String signedPrekey, String signature) {
        this.identityKey = identityKey;
        this.signedPrekey = signedPrekey;
        this.signature = signature;
    }

    public String getIdentityKey() {
        return identityKey;
    }

    public String getSignedPrekey() {
        return signedPrekey;
    }

    public String getSignature() {
        return signature;
    }
}