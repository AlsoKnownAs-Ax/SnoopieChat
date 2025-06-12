package pki_entity.Services;

import pki_entity.DBConnections.X3dhKeysDAO;
import pki_entity.Exceptions.ResourceNotFoundException;
import pki_entity.Models.X3dhKeyBundle;

import java.sql.SQLException;

public class X3dhService {
    private X3dhKeysDAO x3dhKeysDAO;

    public X3dhService(X3dhKeysDAO x3dhKeysDAO) {
        this.x3dhKeysDAO = x3dhKeysDAO;
    }

    public void uploadX3dhKeys(String username, String password, String signedPrekey, String signature)
            throws SQLException {
        // we should verify the user's password before allowing upload
        // For simplicity, we skip this step here
        x3dhKeysDAO.storeX3dhKeys(username, signedPrekey, signature);
    }

    public X3dhKeyBundle getX3dhKeys(String username) throws SQLException, ResourceNotFoundException {
        return x3dhKeysDAO.getX3dhKeys(username);
    }

    public void uploadPreKeyBundle(String username, String password, String signature, String createdAt, String prekeyJwk) throws SQLException {
        x3dhKeysDAO.storePreKeyBundle(username, signature, createdAt, prekeyJwk);
    }

    public void uploadIdentityPublicKey(String username, String identityPublicKey) throws SQLException {
        x3dhKeysDAO.uploadIdentityPublicKey(username, identityPublicKey);
    }
}