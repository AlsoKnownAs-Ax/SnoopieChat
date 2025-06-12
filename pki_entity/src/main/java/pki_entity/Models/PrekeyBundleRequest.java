package pki_entity.Models;

public class PrekeyBundleRequest {
    private String signature;
    private String createdAt;
    private String prekeyJwk;

    // Getters and setters
    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getPrekeyJwk() {
        return prekeyJwk;
    }

    public void setPrekeyJwk(String prekeyJwk) {
        this.prekeyJwk = prekeyJwk;
    }
}