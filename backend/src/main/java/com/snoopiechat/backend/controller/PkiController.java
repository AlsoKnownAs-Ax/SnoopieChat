package com.snoopiechat.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.snoopiechat.backend.dto.x3dh.X3dhKeyBundleResponse;
import com.snoopiechat.backend.dto.x3dh.X3dhKeyBundleUploadRequest;
import com.snoopiechat.backend.service.PkiService;

@RestController
@RequestMapping("/pki")
public class PkiController {

    @Autowired
    private PkiService pkiService;
    
    @GetMapping("/key-bundle")
    public ResponseEntity<X3dhKeyBundleResponse> getKeyBundle(@RequestParam String username) {
        return ResponseEntity.ok(pkiService.getKeyBundle(username));
    }

    @PostMapping("upload/key-bundle")
    public ResponseEntity<String> uploadKeyBundle(@RequestBody X3dhKeyBundleUploadRequest request){
        return ResponseEntity.ok(pkiService.uploadKeyBundle(request));
    }
}