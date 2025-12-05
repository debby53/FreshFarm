## Fresh Farm Produce Marketplace – Core Diagrams

### Use Case Diagram
```mermaid
---
title: Fresh Farm Use Cases
---
usecaseDiagram
    actor Farmer
    actor Buyer
    actor Admin

    rectangle Platform {
        Farmer --> (Register / Login)
        Farmer --> (Post / Update Product)
        Farmer --> (Remove Product)
        Farmer --> (View Orders)
        Farmer --> (Update Order Status)
        Farmer --> (Respond to Messages)

        Buyer --> (Register / Login)
        Buyer --> (Browse & Search Products)
        Buyer --> (Add to Cart)
        Buyer --> (Place Order)
        Buyer --> (View Order History)
        Buyer --> (Send Message)
        Buyer --> (Rate Product)

        Admin --> (Manage Users)
        Admin --> (Monitor Transactions)
        Admin --> (Manage Platform Settings)
        Admin --> (Resolve Disputes)
        Admin --> (Generate Reports)
    }
```

### Activity Diagram – Buyer Places Order
```mermaid
---
title: Buyer Order Flow
---
flowchart TD
    A[Start] --> B[Login / Register]
    B --> C{Authenticated?}
    C -- No --> B
    C -- Yes --> D[Browse or Search Products]
    D --> E[View Product Details]
    E --> F[Add Item to Cart]
    F --> G{Checkout?}
    G -- No --> D
    G -- Yes --> H[Select Delivery Option]
    H --> I[Confirm Payment Method]
    I --> J[Place Order]
    J --> K[Create Order & Transaction]
    K --> L[Notify Farmer]
    L --> M[Display Order Confirmation]
    M --> N[End]
```

### Class Diagram
```mermaid
---
title: Fresh Farm Domain Model
---
classDiagram
    class User {
        +Long id
        +String username
        +String email
        +String password
        +String phone
        +String address
        +String userType
        +LocalDateTime registeredDate
    }
    class Farmer {
        +Long farmerId
        +String farmName
        +String location
        +String description
        +Double rating
    }
    class Buyer {
        +Long buyerId
        +String deliveryAddress
        +String preferredPayment
    }
    class Admin {
        +Long adminId
        +String role
    }
    class Product {
        +Long id
        +String productName
        +String category
        +String description
        +Double price
        +String unit
        +Integer quantity
        +String imageUrl
        +LocalDateTime postedDate
        +Boolean available
    }
    class Cart {
        +Long id
        +LocalDateTime createdDate
        +Double totalAmount
    }
    class CartItem {
        +Long id
        +Integer quantity
        +Double subtotal
    }
    class Order {
        +Long id
        +LocalDateTime orderDate
        +Double totalAmount
        +String deliveryMethod
        +String deliveryAddress
        +String status
        +LocalDateTime deliveryDate
    }
    class OrderItem {
        +Long id
        +Integer quantity
        +Double priceAtOrder
        +Double subtotal
    }
    class Message {
        +Long id
        +String content
        +LocalDateTime sentDate
        +Boolean isRead
    }
    class Transaction {
        +Long id
        +Double amount
        +String paymentMethod
        +String status
        +LocalDateTime transactionDate
    }
    class Review {
        +Long id
        +Integer rating
        +String comment
        +LocalDateTime reviewDate
    }

    User <|-- Farmer
    User <|-- Buyer
    User <|-- Admin
    Farmer "1" --> "0..*" Product : posts
    Product "0..*" --> "1" Farmer : ownedBy
    Buyer "1" --> "1" Cart
    Cart "1" --> "0..*" CartItem
    CartItem "*" --> "1" Product
    Buyer "1" --> "0..*" Order
    Order "1" --> "0..*" OrderItem
    OrderItem "*" --> "1" Product
    Order "1" --> "1" Transaction
    Buyer "1" --> "0..*" Message : sends
    Farmer "1" --> "0..*" Message : replies
    Buyer "1" --> "0..*" Review
    Review "*" --> "1" Product
    Admin "1" --> "0..*" Review : moderates
    Admin "1" --> "0..*" Transaction : monitors
```

These diagrams provide the shared vocabulary needed before diving into the Spring Boot + React implementation.

