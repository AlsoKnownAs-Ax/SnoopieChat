package com.snoopiechat.backend.mixnets;

import com.snoopiechat.backend.util.CryptoUtils;
import com.snoopiechat.backend.util.SerializationUtils;

import java.io.Serializable;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.List;
import java.util.UUID;

import lombok.Getter;

@Getter
public class Envelope implements Serializable {
    private final UUID messageId;
    private final UUID outerMessageId;
    private final int receiverNodeId;

    private byte[] encryptedPayload;
    private byte[] encryptedKey;

    // Constructor for the outermost envelope (starts outerMessageId = messageId)
    public Envelope(int receiverNodeId, byte[] payload) {
        this.messageId = UUID.randomUUID();
        this.outerMessageId = this.messageId;
        this.receiverNodeId = receiverNodeId;
        this.encryptedPayload = payload;
    }

    // Constructor for inner envelopes, propagates outerMessageId
    public Envelope(int receiverNodeId, byte[] payload, UUID outerMessageId) {
        this.messageId = UUID.randomUUID();
        this.outerMessageId = outerMessageId;
        this.receiverNodeId = receiverNodeId;
        this.encryptedPayload = payload;
    }

    public void encrypt(PublicKey publicKey) {
        try {
            byte[] aesKey = CryptoUtils.generateAESKey();
            byte[] encryptedData = CryptoUtils.aesEncrypt(this.encryptedPayload, aesKey);
            byte[] encryptedAesKey = CryptoUtils.rsaEncrypt(aesKey, publicKey);

            this.encryptedPayload = encryptedData;
            this.encryptedKey = encryptedAesKey;
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public void decrypt(PrivateKey privateKey) {
        try {
            byte[] aesKey = CryptoUtils.rsaDecrypt(this.encryptedKey, privateKey);
            byte[] decryptedData = CryptoUtils.aesDecrypt(this.encryptedPayload, aesKey);

            this.encryptedPayload = decryptedData;
            this.encryptedKey = null;
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    public static Envelope createOnion(List<Node> nodes, Serializable message) throws Exception {
        byte[] data = SerializationUtils.serialize(message);
        Envelope current = null;

        for (int i = nodes.size() - 1; i >= 0; i--) {
            Node node = nodes.get(i);
            if (current == null) {
                current = new Envelope(node.getNodeId(), data);
            } else {
                byte[] serialized = SerializationUtils.serialize(current);
                current = new Envelope(node.getNodeId(), serialized, current.getOuterMessageId());
            }
            current.encrypt(node.getPublicKey());
        }
        return current;
    }
}