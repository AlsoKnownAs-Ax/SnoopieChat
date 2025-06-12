package pki_entity.Exceptions;

public class PkiDBException extends Exception {
    public PkiDBException(String pkiDbConnectionFailed) {
        super(pkiDbConnectionFailed);
    }
}
