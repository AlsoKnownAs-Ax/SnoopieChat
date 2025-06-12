package pki_entity.Models;

import java.time.LocalDateTime;

public class X3dhKeyBundle {
    private String username;
    private String identityPublicKey;
    private String signedPrekey;
    private String signedPrekeySignature;
    private LocalDateTime generatedAt;

    public X3dhKeyBundle() {
    }

    public X3dhKeyBundle(String username, String identityPublicKey, String signedPrekey, String signedPrekeySignature) {
        this.username = username;
        this.identityPublicKey = identityPublicKey;
        this.signedPrekey = signedPrekey;
        this.signedPrekeySignature = signedPrekeySignature;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getIdentityPublicKey() {
        return identityPublicKey;
    }

    public void setIdentityPublicKey(String identityPublicKey) {
        this.identityPublicKey = identityPublicKey;
    }

    public String getSignedPrekey() {
        return signedPrekey;
    }

    public void setSignedPrekey(String signedPrekey) {
        this.signedPrekey = signedPrekey;
    }

    public String getSignedPrekeySignature() {
        return signedPrekeySignature;
    }

    public void setSignedPrekeySignature(String signedPrekeySignature) {
        this.signedPrekeySignature = signedPrekeySignature;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}