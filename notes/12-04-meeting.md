## Date: 12/04/2025

## 1. Project Structure

**Project Type:** Web Application

The project is organized into the following main components:
- `frontend`
- `backend`
- `PKI`

**Communication:**  
All components will communicate via **API calls**, ensuring modularity and separation of concerns.

---

## 2. Spring Boot Crash Course

Quick breakdown of key Spring Boot components:

- **Config:**  
  Holds configuration classes and settings such as security config, application-wide beans, or third-party integrations.

- **Controller:**  
  Handles HTTP requests, acts as an entry point for the client, and routes requests to appropriate services.

- **Model:**  
  Defines the structure of data (usually mapped to database entities) used throughout the application.

- **Repository:**  
  Interfaces that provide CRUD operations for models using Spring Data JPA.

- **Service:**  
  Contains the business logic of the application and serves as a bridge between controllers and repositories.

---

## 3. Sub-Teams

To maintain a clean and organized project structure, the team is split into:
- **Frontend**
- **Backend**
- **PKI**

Each team is responsible for managing their respective modules and maintaining seamless integration.

---

## 4. Branching Strategy

We follow the **Git Flow** branching model to ensure clarity and consistency across development.

**Branch Naming Convention:**  
`[category]/[branch-name]`  

Example: `feature/auth-api` – represents implementation of authentication API logic.

Git-flow categories:
- `feature/`
- `bugfix/`
- `release/`
- `hotfix/` - Used to quickly fix critical bugs on production. ( not our case )
- `develop/` - Serves as the staging enviroment for a feature. ( we can discuss to see if we will use this)