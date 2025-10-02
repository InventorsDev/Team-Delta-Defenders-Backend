# Team-Delta-Defenders-Backend
Agrilink Backend

A marketplace SaaS platform connecting farmers directly with buyers, eliminating middleman inefficiencies in agricultural trade.

https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs

https://img.shields.io/badge/Node.js-18+-339933?logo=node.js

https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb

https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript

## Overview
Agrilink is a production-grade backend API built with NestJS that empowers farmers to sell their produce directly to buyers, creating a transparent and efficient agricultural marketplace. By removing intermediaries, we ensure fair pricing for farmers and fresh products for buyers.
Key Features

Direct Marketplace: Connect farmers and buyers without intermediaries
Real-time Communication: WebSocket support for instant updates and chat
Secure Authentication: JWT-based authentication with Passport strategies
File Upload Management: Handle product images and documents
Email Notifications: Automated email system for transactions and updates
Scalable Architecture: Built on NestJS with MongoDB for high performance

### Tech Stack

- Framework: NestJS 11.x
- Language: TypeScript
- Runtime: Node.js
- Database: MongoDB with Mongoose ODM
- Authentication: Passport.js (JWT & Local strategies)
- Real-time: Socket.IO
- Validation: class-validator & class-transformer
- File Upload: Multer
- Email: Nodemailer
- Testing: Jest

#### Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v18 or higher)
npm or yarn
MongoDB (v6 or higher)
Git


## Clone the repository
```bash
git clone https://github.com/InventorsDev/Team-Delta-Defenders-Backend
cd agrilink-backend
```
## Project setup

```bash
$ npm install
```

## Environment Configuration

Create a .env file in the root directory:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/agrilink

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@agrilink.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3001
```
## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


## API Documentation
Development: http://localhost:5500/api
Production:  https://team-delta-defenders-backend-1.onrender.com


## Deployment

Docker Deployment

#### Build Docker image
docker build -t agrilink-backend .

#### Run container
docker run -p 5500:5500 --env-file .env agrilink-backend

