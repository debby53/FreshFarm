# Logging Implementation Example

This shows how to replace `System.out.println` with proper logging.

## Step 1: Add Logback Configuration

Create `src/main/resources/logback-spring.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE" />
        </root>
        <logger name="com.FreshFarmPlatform.demo" level="DEBUG"/>
    </springProfile>
    
    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/application.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/application-%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="WARN">
            <appender-ref ref="FILE" />
        </root>
        <logger name="com.FreshFarmPlatform.demo" level="INFO"/>
    </springProfile>
</configuration>
```

## Step 2: Update ProductService.java

**Before:**
```java
System.out.println("Found " + products.size() + " products with filters: keyword=" + keyword);
System.err.println("Error in listProducts: " + e.getMessage());
e.printStackTrace();
```

**After:**
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    
    public List<ProductResponse> listProducts(...) {
        try {
            // ... existing code ...
            log.debug("Found {} products with filters: keyword={}, category={}, status={}", 
                     products.size(), keyword, category, status);
            return products.stream()...;
        } catch (Exception e) {
            log.error("Error in listProducts with filters: keyword={}, category={}", 
                     keyword, category, e);
            throw new RuntimeException("Failed to fetch products", e);
        }
    }
}
```

## Step 3: Update OrderController.java

**Before:**
```java
System.out.println("Received order request: " + request);
System.err.println("Error in createOrder: " + e.getMessage());
e.printStackTrace();
```

**After:**
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating order with {} items, delivery={}, payment={}", 
                request.items() != null ? request.items().size() : 0,
                request.deliveryMethod(), 
                request.paymentMethod());
        return ResponseEntity.ok(orderService.createOrder(request));
    }
}
```

## Step 4: Update ProductController.java

**Before:**
```java
try {
    List<ProductResponse> products = productService.listProducts(...);
    return ResponseEntity.ok(products);
} catch (Exception e) {
    System.err.println("Error fetching products: " + e.getMessage());
    e.printStackTrace();
    return ResponseEntity.ok(List.of());
}
```

**After:**
```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private static final Logger log = LoggerFactory.getLogger(ProductController.class);
    
    @GetMapping
    public ResponseEntity<List<ProductResponse>> list(...) {
        log.debug("Fetching products with filters: keyword={}, category={}, status={}", 
                 keyword, category, status);
        List<ProductResponse> products = productService.listProducts(...);
        return ResponseEntity.ok(products);
    }
}
```

## Log Levels Guide

- **ERROR**: For errors that need immediate attention
- **WARN**: For warnings that might indicate problems
- **INFO**: For important business events (order created, user registered)
- **DEBUG**: For detailed information useful for debugging
- **TRACE**: For very detailed information (usually disabled in production)

## Best Practices

1. **Use parameterized logging**: `log.info("User {} logged in", username)` instead of `log.info("User " + username + " logged in")`
2. **Don't log sensitive data**: Never log passwords, tokens, or credit card numbers
3. **Use appropriate levels**: Don't use ERROR for normal flow
4. **Include context**: Log relevant IDs, usernames, etc. for debugging
5. **Log exceptions properly**: Use `log.error("message", exception)` not `log.error(exception.getMessage())`

