# AI Product Manager - API Flow Diagram

## Complete Architecture Flow

```
Frontend (React)                    Backend (NestJS)                    Gemini API                 Database
       |                                 |                                   |                          |
       | 1. Upload Image                  |                                   |                          |
       |-------------------------------->|                                   |                          |
       |                                 | 2. Receive Image                  |                          |
       |                                 |--------------------------------->|                          |
       |                                 |                                   | 3. Analyze Image         |
       |                                 |                                   |------------------------>|
       |                                 |                                   |                          |
       |                                 |                                   | 4. Return JSON Response |
       |                                 |                                   |<------------------------|
       |                                 | 5. Parse & Return Products        |                          |
       |                                 |<---------------------------------|                          |
       | 6. Display Products              |                                   |                          |
       |<---------------------------------|                                   |                          |
       | 7. User Edits/Confirms           |                                   |                          |
       |-------------------------------->|                                   |                          |
       |                                 | 8. Create Products in DB          |                          |
       |                                 |--------------------------------->|                          |
       |                                 |                                   | 9. Store Products        |
       |                                 |                                   |------------------------>|
       |                                 | 10. Return Success                 |                          |
       |                                 |<---------------------------------|                          |
       | 11. Show Success Message         |                                   |                          |
       |<---------------------------------|                                   |                          |
```

## API Endpoints

### 1. Image Analysis
```
POST /ai-products/analyze
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- image: File (multipart/form-data)

Response:
{
  "success": true,
  "data": [
    {
      "name": "Mahsulot nomi",
      "quantity": 10,
      "price": 50000,
      "total": 500000
    }
  ],
  "message": "2 ta mahsulot topildi"
}
```

### 2. Bulk Product Creation
```
POST /ai-products/bulk-create
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "products": [
    {
      "name": "Mahsulot nomi",
      "quantity": 10,
      "price": 50000,
      "total": 500000
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "created": 2,
    "products": [...]
  },
  "message": "2 ta mahsulot muvaffaqiyatli yaratildi"
}
```

## Gemini API Integration

### Request Format
```javascript
{
  "contents": [{
    "role": "user",
    "parts": [
      { "text": "Rasmda yozilgan mahsulotlarni aniqlab ber..." },
      { "inline_data": { "mime_type": "image/jpeg", "data": "base64..." } }
    ]
  }]
}
```

### Expected Response Format
```json
[
  {
    "name": "mahsulot nomi",
    "quantity": 10,
    "price": 50000,
    "total": 500000
  },
  {
    "name": "ikkinchi mahsulot nomi",
    "quantity": 5,
    "price": 25000,
    "total": 125000
  }
]
```

## Database Schema (Existing Product Model)

```sql
CREATE TABLE Product (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  model             TEXT NOT NULL,
  unit              TEXT NOT NULL,
  barcode           TEXT NOT NULL,
  costPrice         REAL NOT NULL,
  sellPrice         REAL NOT NULL,
  price             REAL DEFAULT 0,
  quantity          INTEGER NOT NULL,
  status            TEXT DEFAULT 'ACTIVE',
  branchId          TEXT NOT NULL,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  shopId            TEXT NOT NULL,
  
  FOREIGN KEY (branchId) REFERENCES Branch(id),
  FOREIGN KEY (shopId) REFERENCES Shop(id),
  UNIQUE (barcode, branchId)
);
```

## Error Handling

### Frontend Errors
- File validation (image type check)
- Network error handling
- User input validation
- Loading states

### Backend Errors
- File upload validation
- Gemini API retry logic (3 attempts with exponential backoff)
- JSON parsing validation
- Database transaction errors
- Authentication/Authorization errors

### Gemini API Errors
- 503 Service Unavailable: 10s retry
- High demand errors: 15s retry
- Other errors: 5s retry
- Maximum 3 retry attempts

## Security Features

1. **Authentication**: JWT token required for all endpoints
2. **File Upload**: Multer with file type validation
3. **Input Validation**: DTO validation for all inputs
4. **Database Transactions**: ACID compliance for bulk operations
5. **Error Sanitization**: No sensitive data in error messages

## Production Considerations

1. **Rate Limiting**: Implement for Gemini API calls
2. **File Size Limits**: Configure appropriate limits
3. **Monitoring**: Log all AI operations
4. **Caching**: Cache successful analyses if needed
5. **Scaling**: Consider queue system for bulk operations

## Environment Variables

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your_jwt_secret
```

## Frontend Component Features

1. **Image Upload**: Gallery + Camera support
2. **Preview**: Image preview before analysis
3. **Loading States**: Proper loading indicators
4. **Editable Table**: In-place editing of detected products
5. **Validation**: Real-time validation of inputs
6. **Auto-calculation**: Total = Price × Quantity
7. **Delete Function**: Remove unwanted products
8. **Responsive Design**: Mobile-friendly layout
9. **Toast Notifications**: User feedback for all actions
10. **Error Handling**: Graceful error display
