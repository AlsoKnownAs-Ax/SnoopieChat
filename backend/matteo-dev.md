# UserModel.java Documentation

## Overview

The `UserModel` class is a JPA entity that represents users in the SnoopieChat application. It maps to the `users` table in the database and serves as the core data structure for user authentication and management.

## Key Features

1. **Unique Identifiers**:
   - Primary key: Auto-incremented `id` field
   - Business identifiers: `email` and `username` (both unique in the database)

2. **Required Fields**:
   - `username`: 3-50 characters, unique across all users
   - `password`: Required for authentication
   - `email`: Must be valid format, unique across all users

3. **Audit Timestamps**:
   - `createdAt`: Automatically set when a user record is created
   - `updatedAt`: Automatically updated whenever the user record changes

## Validation Annotations

The class uses Jakarta validation annotations to enforce data integrity:

- `@NotBlank`: Ensures strings are not null, empty, or just whitespace
- `@Size`: Enforces character count limits 
- `@Email`: Validates email format
- `@NotNull`: Ensures the field is not null

## Field Constraints

1. **username**:
   ```java
   @NotBlank(message = "Username is required")
   @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
   @Column(nullable = false, unique = true)
   ```

2. **email**:
   ```java
   @NotNull(message = "Email is required")
   @Email(message = "Invalid email format")
   @Column(unique = true, nullable = false)
   ```

3. **timestamps**:
   ```java
   @CreationTimestamp
   @Column(name = "created_at", updatable = false)
   private LocalDateTime createdAt;
   
   @UpdateTimestamp
   @Column(name = "updated_at")
   private LocalDateTime updatedAt;
   ```

## How to Use

### Creating a New User

```java
// Create a new user
UserModel newUser = new UserModel();
newUser.setUsername("johndoe");
newUser.setEmail("john.doe@example.com");
newUser.setPassword("securePassword123"); // Should be encrypted before saving

// Or use the constructor
UserModel anotherUser = new UserModel("janedoe", "securePassword456", "jane.doe@example.com");

// Save the user using the repository
authenticationRepository.save(newUser);
```

### Finding Users

```java
// Find by ID
Optional<UserModel> userById = authenticationRepository.findById(1L);

// Find by email (preferred way for authentication)
Optional<UserModel> userByEmail = authenticationRepository.findByEmail("john.doe@example.com");

// Find by username
Optional<UserModel> userByUsername = authenticationRepository.findByUsername("johndoe");

// Case-insensitive email search
Optional<UserModel> userByEmailIgnoreCase = authenticationRepository.findByEmailIgnoreCase("John.Doe@example.com");
```

### Checking If User Exists

```java
// Check if email is already registered
boolean emailExists = authenticationRepository.existsByEmail("john.doe@example.com");

// Check if username is already taken
boolean usernameExists = authenticationRepository.existsByUsername("johndoe");
```

### Updating User Information

```java
// Update user details
UserModel user = authenticationRepository.findByEmail("john.doe@example.com").orElseThrow();
user.setUsername("john.doe.updated");
authenticationRepository.save(user);

// Update password directly
authenticationRepository.updatePassword(userId, "newSecurePassword789");
```

## Best Practices

1. **Password Security**: Never store plain-text passwords. Use a password encoder like BCrypt:
   ```java
   // In a service class with BCryptPasswordEncoder dependency
   user.setPassword(passwordEncoder.encode(rawPassword));
   ```

2. **Email Case Sensitivity**: Use `findByEmailIgnoreCase()` when authenticating users to allow for email case variations.

3. **Validation**: The entity includes validation annotations, but also validate at the controller/service level:
   ```java
   // In a service class
   if (authenticationRepository.existsByEmail(newUser.getEmail())) {
       throw new UserAlreadyExistsException("Email already registered");
   }
   ```

4. **Auditing**: The class automatically manages timestamps, so no need to set them manually.

## Database Schema

When this entity is used with JPA/Hibernate, it will generate a `users` table with the following structure:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

# AuthenticationRepository.java Documentation

## Overview

The `AuthenticationRepository` interface provides database access methods for user authentication and management in the SnoopieChat application. It extends Spring Data JPA's `JpaRepository` to handle CRUD operations on the `UserModel` entity.

## Key Features

1. **Standard JPA Operations**:
   - Create/update users with `save()`
   - Find users by ID with `findById()`
   - Delete users with `delete()` or `deleteById()`
   - List all users with `findAll()`

2. **Email-Based Operations**:
   - Find users by email (exact match)
   - Find users by email (case-insensitive match)
   - Check if an email exists

3. **Username-Based Operations**:
   - Find users by username
   - Check if a username exists
   - Search users by partial username

4. **Authentication Operations**:
   - Find users by email and password
   - Update a user's password directly

## Method Descriptions

### Email-Based Methods

```java
// Find a user by exact email match
Optional<UserModel> findByEmail(String email);

// Find a user by email, ignoring case
@Query("SELECT u FROM UserModel u WHERE LOWER(u.email) = LOWER(:email)")
Optional<UserModel> findByEmailIgnoreCase(@Param("email") String email);

// Check if an email is already registered
boolean existsByEmail(String email);
```

### Username-Based Methods

```java
// Find a user by exact username match
Optional<UserModel> findByUsername(String username);

// Check if a username is already taken
boolean existsByUsername(String username);

// Search users with username pattern (e.g., "%john%")
@Query("SELECT u FROM UserModel u WHERE u.username LIKE :usernamePattern")
List<UserModel> findByUsernameLike(@Param("usernamePattern") String usernamePattern);
```

### Authentication Methods

```java
// Authentication by email and password
Optional<UserModel> findByEmailAndPassword(String email, String password);

// Update a user's password directly
@Modifying
@Transactional
@Query("UPDATE UserModel u SET u.password = :newPassword WHERE u.id = :userId")
int updatePassword(@Param("userId") Long userId, @Param("newPassword") String newPassword);
```

## How to Use

### User Registration

```java
// Check if email/username already exists before registration
boolean emailExists = authRepository.existsByEmail("new.user@example.com");
boolean usernameExists = authRepository.existsByUsername("newuser");

if (!emailExists && !usernameExists) {
    UserModel newUser = new UserModel("newuser", "securePassword", "new.user@example.com");
    // Encrypt password before saving
    authRepository.save(newUser);
}
```

### User Authentication

```java
// Using email for login (recommended approach)
Optional<UserModel> user = authRepository.findByEmailIgnoreCase(loginEmail);
if (user.isPresent() && passwordEncoder.matches(rawPassword, user.get().getPassword())) {
    // Authentication successful
}

// Alternative direct method (not recommended - use password encoder instead)
Optional<UserModel> user = authRepository.findByEmailAndPassword(email, encodedPassword);
```

### User Search

```java
// Find users with similar usernames (for search functionality)
List<UserModel> matchingUsers = authRepository.findByUsernameLike("%john%");
```

### Password Management

```java
// Update password securely
String encodedNewPassword = passwordEncoder.encode(rawNewPassword);
authRepository.updatePassword(userId, encodedNewPassword);
```

## Best Practices

1. **Security**: 
   - Never use `findByEmailAndPassword()` with plain text passwords
   - Always use a password encoder when dealing with passwords
   - The method is provided mainly for compatibility with legacy systems

2. **Email Authentication**:
   - Prefer `findByEmailIgnoreCase()` over `findByEmail()` for login to improve user experience
   - This allows users to enter their email with any capitalization

3. **Transaction Management**:
   - The `updatePassword()` method has the `@Transactional` annotation
   - For other complex operations, manage transactions at the service level

4. **Error Handling**:
   - All find methods return `Optional<>` to safely handle non-existent users
   - Check for existence before saving to avoid unique constraint violations

## Implementation Notes

Spring Data JPA automatically implements this interface at runtime - no manual implementation is needed. Methods are either:

1. **Query methods**: Automatically derived from method names (e.g., `findByEmail`)
2. **Custom queries**: Explicitly defined with `@Query` annotation

This repository can be autowired into service classes to provide the data access layer for user management.

```java
@Service
public class AuthenticationService {
    @Autowired
    private AuthenticationRepository authRepository;
    
    // Service methods using the repository
}
```


