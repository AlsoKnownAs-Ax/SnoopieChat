package com.snoopiechat.backend.mixnets;

import com.snoopiechat.backend.util.CryptoUtils;
import com.snoopiechat.backend.util.SerializationUtils;

import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.Setter;

import java.security.*;
import java.util.*;
import java.util.concurrent.*;

public class Node {
    private final int DELAY = 200;
    @Getter
    private final int nodeId;
    private final PrivateKey privateKey;
    @Getter
    private final PublicKey publicKey;

    private final BlockingQueue<Envelope> queue = new LinkedBlockingQueue<>();
    @Setter
    private Node nextNode;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public Node(int nodeId) {
        this.nodeId = nodeId;

        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048);
            KeyPair pair = keyGen.generateKeyPair();
            this.privateKey = pair.getPrivate();
            this.publicKey = pair.getPublic();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        startProcessing();
    }

    public void receive(Envelope env) throws InterruptedException {
        queue.put(env);
    }

    private void startProcessing() {
        executor.submit(() -> {
            while (true) {
                try {
                    Envelope firstEnvelope = queue.take();
                    List<Envelope> batch = new ArrayList<>();
                    batch.add(firstEnvelope);
                    queue.drainTo(batch);

                    Collections.shuffle(batch);

                    for (Envelope env : batch) {
                        //System.out.println("Node " + nodeId + ": processing new envelope.");

                        env.decrypt(privateKey);
                        simulateDelay();
                        //System.out.println("Node " + nodeId + ": decrypted envelope.");

                        Object payload;
                        try {
                            payload = SerializationUtils.deserialize(env.getEncryptedPayload());
                            //System.out.println("Node " + nodeId + ": successfully deserialized payload.");
                        } catch (Exception e) {
                            //System.out.println("Node " + nodeId + ": deserialization failed — treating as raw message.");
                            payload = null;
                        }

                        if (payload instanceof Envelope && nextNode != null) {
                            // Pass the envelope to the next node, keeping the original envelope's message ID
                            nextNode.receive((Envelope) payload);
                        } else {
                            Object finalPayload;
                            if (payload != null) {
                                finalPayload = payload;
                            } else {
                                finalPayload = new String(env.getEncryptedPayload());
                            }
                            // Complete the future using the original envelope (for correct message ID)
                            MixnetRouter.completeWithPayload(env, finalPayload);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @PreDestroy
    private void shutDown() {
        executor.shutdownNow();
    }
    private void simulateDelay() throws InterruptedException {
        Thread.sleep(DELAY + (long)(Math.random() * DELAY));
    }
}