# Environment Variables Setup

## Problem
Sensitive data (database password, JWT secret) is hardcoded in `application.properties`.

## Solution: Use Environment Variables

### Step 1: Update application.properties

**Before:**
```properties
spring.datasource.password=123456
application.jwt.secret=FreshFarmSecretKey12345678901234567890
```

**After:**
```properties
# Use environment variables with defaults for local development
spring.datasource.password=${DB_PASSWORD:123456}
application.jwt.secret=${JWT_SECRET:FreshFarmSecretKey12345678901234567890}
```

### Step 2: Create application-dev.properties

```properties
# Development profile
spring.datasource.url=jdbc:postgresql://localhost:5432/FRESHFARM
spring.datasource.username=postgres
spring.datasource.password=123456

application.jwt.secret=dev-secret-key-change-in-production
application.jwt.expiration-ms=86400000

# Enable debug logging in dev
logging.level.com.FreshFarmPlatform.demo=DEBUG
```

### Step 3: Create application-prod.properties

```properties
# Production profile - use environment variables
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

application.jwt.secret=${JWT_SECRET}
application.jwt.expiration-ms=${JWT_EXPIRATION_MS:86400000}

# Production logging
logging.level.root=WARN
logging.level.com.FreshFarmPlatform.demo=INFO
logging.file.name=logs/application.log

# Disable SQL logging in production
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Use validate instead of update
spring.jpa.hibernate.ddl-auto=validate
```

### Step 4: Create .env.example file

```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/FRESHFARM
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_secret_key_here_minimum_32_characters
JWT_EXPIRATION_MS=86400000

# File Storage
FILE_STORAGE_LOCATION=uploads
```

### Step 5: Add .env to .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Application properties with secrets
application-prod.properties
```

### Step 6: Set Environment Variables

**Windows (PowerShell):**
```powershell
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secret_key"
```

**Windows (Command Prompt):**
```cmd
set DB_PASSWORD=your_password
set JWT_SECRET=your_secret_key
```

**Linux/Mac:**
```bash
export DB_PASSWORD="your_password"
export JWT_SECRET="your_secret_key"
```

**Or create a .env file and use:**
```bash
# Install dotenv-cli: npm install -g dotenv-cli
dotenv -e .env -- mvn spring-boot:run
```

### Step 7: Run with Profile

**Development:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Production:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Or set in application.properties:
```properties
spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}
```

## Docker Example

If using Docker, create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    image: freshfarm-marketplace:latest
    environment:
      - DB_URL=jdbc:postgresql://db:5432/FRESHFARM
      - DB_USERNAME=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - SPRING_PROFILES_ACTIVE=prod
    ports:
      - "8080:8080"
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=FRESHFARM
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong passwords** (minimum 16 characters, mix of letters, numbers, symbols)
3. **Use strong JWT secrets** (minimum 32 characters, random)
4. **Rotate secrets regularly** in production
5. **Use secret management tools** in production (AWS Secrets Manager, HashiCorp Vault, etc.)
6. **Limit access** to production environment variables
7. **Use different secrets** for dev, staging, and production

## Quick Checklist

- [ ] Update application.properties to use environment variables
- [ ] Create application-dev.properties
- [ ] Create application-prod.properties
- [ ] Create .env.example
- [ ] Add .env to .gitignore
- [ ] Set environment variables locally
- [ ] Test with dev profile
- [ ] Document how to set environment variables in production

