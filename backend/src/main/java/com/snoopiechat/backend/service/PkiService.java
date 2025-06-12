package com.snoopiechat.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.http.HttpStatus;

import com.snoopiechat.backend.config.PkiConfig;
import com.snoopiechat.backend.dto.x3dh.X3dhIdentityKeyRequest;
import com.snoopiechat.backend.dto.x3dh.X3dhKeyBundleResponse;
import com.snoopiechat.backend.dto.x3dh.X3dhKeyBundleUploadRequest;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.repository.UserRepo;

import java.net.URI;

@Service
public class PkiService {

    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private PkiConfig pkiConfig;

    @Autowired
    private UserRepo userRepo;
    
    /**
     * Register a new user with the PKI service
     * @param username User's username
     * @param password User's password
     * @param publicKey User's public key
     * @return Response from the PKI service (Signed Certificate)
     */
    public String registerUser(String username, String password, String publicKey) {
        try {
            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Build form parameters
            MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
            formParams.add("username", username);
            formParams.add("password", password);
            formParams.add("public_key", publicKey);

            // Create request entity with form parameters
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formParams, headers);

            // Build the URI
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/register")
                .build()
                .encode()
                .toUri();

            // Execute POST request
            ResponseEntity<String> response = restTemplate.postForEntity(
                    uri,
                    requestEntity,
                    String.class);

            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error registering user with PKI", e);
        }
    }
    
    /**
     * Revoke a user's certificate from the PKI service
     * @param username User's username
     * @param password User's password
     * @return Response from the PKI service
     */
    public String revokeCertificate(String username, String password) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/revoke")
                .queryParam("username", username)
                .queryParam("password", password)
                .build()
                .encode()
                .toUri();
                
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error revoking certificate", e);
        }
    }

    /**
     * Fetch certificate and validate certificate for a specific user
     * @param subject Username to fetch certificate for
     * @return isValid or not
     */
    public boolean fetchAndValidateCertificate(String subject){
        String certificate = fetchCertificate(subject);
        return validateCertificate(certificate);
    }
    
    /**
     * Fetch a certificate for a specific user
     * @param subject Username to fetch certificate for
     * @return User's certificate
     */
    private String fetchCertificate(String subject) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/fetch")
                .queryParam("subject", subject)
                .build()
                .encode()
                .toUri();
                
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error fetching certificate", e);
        }
    }
    
    /**
     * Validate a certificate
     * @param cert Certificate to validate
     * @return Validation result from the PKI service
     */
    private boolean validateCertificate(String cert) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("cert", cert);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                pkiConfig.getPkiOrigin() + "/validate", 
                request, 
                String.class
            );
            
            String body = response.getBody();
            return Boolean.parseBoolean(body != null ? body.replaceAll("\"", "").trim() : "false");
        } catch (Exception e) {
            throw handlePkiException("Error validating certificate", e);
        }
    }
    
    /**
     * Check if the PKI service is healthy
     * @return true if PKI service is healthy, false otherwise
     */
    public boolean isPkiHealthy() {
        try {
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/health")
                .build()
                .encode()
                .toUri();
                
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Handle exceptions from the PKI service
     * @param message Error message
     * @param e Exception that occurred
     * @return ResponseStatusException with appropriate status and message
     */
    private ResponseStatusException handlePkiException(String message, Exception e) {
        if (e instanceof HttpClientErrorException) {
            HttpClientErrorException clientError = (HttpClientErrorException) e;
            return new ResponseStatusException(
                clientError.getStatusCode(),
                message + ": " + clientError.getResponseBodyAsString(),
                e
            );
        } else if (e instanceof HttpServerErrorException) {
            return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, 
                message + ": PKI service unavailable", 
                e
            );
        } else {
            return new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                message + ": " + e.getMessage(),
                e
            );
        }
    }

    public X3dhKeyBundleResponse getKeyBundle(String username) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/x3dh/fetch")
                .queryParam("username", username)
                .build()
                .encode()
                .toUri();
            
            ResponseEntity<X3dhKeyBundleResponse> response = restTemplate.getForEntity(
                uri, 
                X3dhKeyBundleResponse.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error fetching Key Bundle", e);
        }
    }

    public String uploadIdentityPublicKey(X3dhIdentityKeyRequest request) {
        try {
            MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
            formParams.add("identityPublicKey", request.getIdentityPublicKey());
            formParams.add("username", request.getUsername());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formParams, headers);

            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/x3dh/upload/identityPublicKey")
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<String> response = restTemplate.postForEntity(
                    uri,
                    requestEntity,
                    String.class);

            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error uploading identity public key: ", e);
        }
    }

    /**
     * Upload X3DH key bundle to the PKI service
     * @param request Request containing user ID and key bundle details
     * @return Response from the PKI service
     */
    public String uploadKeyBundle(X3dhKeyBundleUploadRequest request) {
        try {
            Users user = userRepo.findByUsername(request.getUsername());
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Build form parameters matching the PKI server's expected format
            MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
            formParams.add("username", request.getUsername());
            formParams.add("password", user.getPassword());
            formParams.add("signed_prekey", request.getSignedPrekey());
            formParams.add("signature", request.getSignedPrekeySignature());

            // Create request entity with form parameters
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formParams, headers);
            
            URI uri = UriComponentsBuilder.fromUriString(pkiConfig.getPkiOrigin() + "/x3dh/upload")
                .build()
                .encode()
                .toUri();
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                uri,
                requestEntity,
                String.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            throw handlePkiException("Error uploading key bundle", e);
        }
    }
}