# 🕵️ Secret Sharing Web App

A full-stack web application where users can share secrets anonymously. Authenticated users are assigned random anonymous names and avatars, allowing them to post and view secrets without revealing their identity.

🎥 [Demo Video](https://youtu.be/R2wn2txvzYs)

## 🔐 Features

- Login via **OAuth** (Google) or **Email/Password** using Passport.js  
- Anonymous identity using:
  - **Custom REST API** for generating random names  
  - **DiceBear API** for avatars  
- **All Secrets** page: View secrets from all users (only accessible after login)  
- **My Secrets** page: View and manage your own secrets  
- Secrets displayed with anonymous name and avatar  
- Real user info (email, Google profile pic or default icon) is only visible to the user  

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js  
- **Database**: PostgreSQL  
- **Authentication**: Passport.js with **OAuth** and local strategies  
- **Templating**: EJS  
- **Avatar Service**: DiceBear API  
- **Custom REST API**: For anonymous name generation
