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