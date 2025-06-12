package pki_entity.Util;

import com.google.gson.Gson;
import io.javalin.json.JsonMapper;

import java.io.*;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

public class GsonMapper implements JsonMapper {

    private final Gson gson = new Gson();

    @Override
    public <T> T fromJsonStream(InputStream jsonStream, Type targetType) {
        try (Reader reader = new InputStreamReader(jsonStream, StandardCharsets.UTF_8)) {
            return gson.fromJson(reader, targetType);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read JSON stream", e);
        }
    }

    @Override
    public <T> T fromJsonString(String json, Type targetType) {
        return gson.fromJson(json, targetType);
    }

    @Override
    public InputStream toJsonStream(Object obj, Type type) {
        String json = gson.toJson(obj);
        return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String toJsonString(Object obj, Type type) {
        return gson.toJson(obj);
    }

    @Override
    public void writeToOutputStream(Stream<?> stream, OutputStream outputStream) {
        try (Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8)) {
            writer.write("[");
            boolean first = true;
            for (Object item : stream.toList()) {
                if (!first) writer.write(",");
                writer.write(gson.toJson(item));
                first = false;
            }
            writer.write("]");
        } catch (IOException e) {
            throw new RuntimeException("Failed to write JSON array to output stream", e);
        }
    }

}
