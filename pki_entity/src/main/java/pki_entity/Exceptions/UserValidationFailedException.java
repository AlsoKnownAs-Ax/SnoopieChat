package pki_entity.Exceptions;

public class UserValidationFailedException extends Exception {
    public UserValidationFailedException(String message) {
        super(message);
    }

    public UserValidationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
    
}
