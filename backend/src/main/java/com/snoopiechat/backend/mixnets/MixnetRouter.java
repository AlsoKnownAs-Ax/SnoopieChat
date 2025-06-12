package com.snoopiechat.backend.mixnets;

import lombok.Getter;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

public class MixnetRouter {

    @Getter
    private static final Node node1 = new Node(1);
    @Getter
    private static final Node node2 = new Node(2);
    @Getter
    private static final Node node3 = new Node(3);

    private static final Map<UUID, CompletableFuture<Object>> callbacks = new ConcurrentHashMap<>();

    static {
        node1.setNextNode(node2);
        node2.setNextNode(node3);
    }

    public static CompletableFuture<Object> send(Envelope env) {
        CompletableFuture<Object> future = new CompletableFuture<>();
        callbacks.put(env.getOuterMessageId(), future);

        try {
            node1.receive(env);
        } catch (InterruptedException e) {
            future.completeExceptionally(e);
            Thread.currentThread().interrupt();
        }

        return future;
    }

    public static void completeWithPayload(Envelope env, Object finalPayload) {
        CompletableFuture<Object> future = callbacks.remove(env.getOuterMessageId());
        if (future != null) {
            future.complete(finalPayload);
        }
    }
}