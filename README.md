## Project Description:

SnoopieChat is a secure, privacy-focused messaging platform designed to protect users' metadata and communications through advanced anonymization techniques. This application demonstrates practical implementations of multiple metadata protection strategies in a real-time chat environment.

### Project Background
This project was developed as part of the Maastricht University curriculum (Project 2-2).

### Core Privacy Features

SnoopieChat implements three key metadata protection techniques:

1. **Mixnet Simulation** - Messages are routed through simulated mixnets that obscure the communication path between sender and receiver, making traffic analysis more difficult.

2. **Dummy Traffic Generation** - The system generates believable fake message traffic to mask actual communication patterns, providing plausible deniability and resistance to timing analysis.

3. **Padme Padding Scheme** - Messages are padded to standardized sizes using the Padme scheme, preventing message size analysis that could reveal information about content.

### Technical Architecture

#### Frontend
- Built with **Svelte** and **SvelteKit** for a responsive, efficient user interface
- Uses **TypeScript** for enhanced type safety and code reliability
- Real-time messaging updates via **WebSocket** connections
- Responsive UI components from **shadcn-svelte** and **Tailwind CSS**

#### Backend
- **Spring Boot** Java application handling authentication, messaging, and security features
- **WebSocket** integration via STOMP for real-time message delivery
- **JPA/Hibernate** for database interaction and persistence
- **JSON Web Token (JWT)** based authentication system

#### PKI (Public Key Infrastructure)
- Separate **Javalin**-based service providing certificate management and key distribution
- Handles user identity verification and certificate issuance
- Facilitates secure key exchange for end-to-end encryption

#### Development Tools
- **OpenAPI** specification with **Swagger UI** for API documentation and exploration
- Auto-generated TypeScript SDK for type-safe API interactions on the frontend
- SQLite database for simplified development and demonstration

### Current Status

SnoopieChat is a demonstration project showcasing privacy-enhancing technologies in a functional chat application. While the core messaging functionality and metadata protection features are operational, several advanced features remain under development:

- **Double Ratchet Encryption** implementation for enhanced message security
- Complete **Certificate Fetching and Validation** system 

The project serves as a practical example of how various privacy technologies can be integrated into modern web applications to protect user communications from surveillance and traffic analysis.

## How to run the project:

### 1. Run PKI
- Open pki_entity in a separate vscode window
- Run the `Main.java` ( can be found inside `pki_entity/src/main/java/pki_entity/Controller/Main.java`)
- The .env file has been pushed to the repo for the sake of the demo ( same with the sqlite database ).

### 2. Run the backend

- cd into backend folder.
- Run `mvn clean install` and then `mvn spring-boot:run`
- In case maven is not installed. Install it from: [Installer](https://maven.apache.org/download.cgi)

### 3. Run the frontend
- cd into frontend folder
- run `npm i` and then `npm run dev`
- If you want to see the full build project without any lags or development deps optimisations made by vite ( which hurts UX) use `npm run build`
> Note: If you run `npm run dev` sometimes the page will reload since vite is optimising dependecies

### How to use the app:

#### To make the demo easier we provided you with 2 already made accounts:

Email: `demo@account.com`
Password: `DemoAccount@12`
username: `demo1`

Email: `demo2@account.com`
Password: `DemoAccount@12`
username: `demo2`

### IMPORTANT: 
> In order to chat in real time make sure you are in normal browser tab with one account and with the other one in a incognito window. That way the auth token cookies won't override.

------------

##### How to make your own accounts:

1. open `localhost:5173`
2. Click on Create account
3. Create an account
4. Login into the account
5. Open a new incognito window ( so that the auth tokens cookies do not override each other)
6. Create and account and log into the new account
7. On first account click add friends and put the username of the other account
8. Switch tabs and accept the friend request
9. Refresh the broswers and start chatting with eachother in real time
