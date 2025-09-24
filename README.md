
Login page: <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/255b8c9c-edec-4a2b-a1cc-11e5c7023b48" />

Abouts : <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c38e5067-bffa-4792-ab29-1caf6b4fbfd0" />

 <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/67c8a216-93f2-4630-bce6-0173a667bb96" />


Agricultural Product Request & Approval System

This project is a full-stack agricultural product request and approval system designed to reflect Ethiopia’s multi-level administrative hierarchy (Kebele → Woreda → Zone → Region → Federal).

Farmers can request agricultural products, and administrators at different levels can approve, reject, or accept requests. The system ensures secure authentication, request tracking, and proper workflow from the grassroots to the federal level.



 Features
Farmers

Register & log in with secure password hashing (bcrypt) and JWT authentication.

Submit product requests with quantity checks and stock validation.

Track request statuses across all levels (Kebele, Woreda, Zone, Region, Federal).

Update or delete requests if still pending.

View assigned products and confirm delivery once accepted.

🛠️ Administrators

Hierarchical roles: Federal → Region → Zone → Woreda → Kebele.

Role-based permissions to create, update, and manage lower-level accounts.

Add and manage agricultural products (with categories, units, expiry dates, etc.).

Approve, reject, or accept farmer requests within their jurisdiction.

Full audit of requests and farmer profiles in their scope.

 Security

JWT-based authentication with 12h expiry.

Rate limiting & failed login attempt tracking.

Role-based access control (RBAC) and scope validation.

SQL constraints and transactions to ensure data consistency.
Tech Stack

Backend: Node.js, Express.js

Database: MySQL (optimized with indexes, constraints, and transactions)

Authentication: JWT + bcrypt

Frontend: React + Tailwind CSS (trying to deploy on Vercel)

Weekly Internship Report final …
Deployment:Trying to deploy Render (backend), Vercel (frontend)
Install dependencies:
npm install
Run the server:
npm start
API Overview
Farmer Routes

POST /farmer/login – Login as farmer

POST /farmer/requests – Create product request

GET /farmer/requests – View all my requests

PUT /farmer/requests/:id – Update my request

DELETE /farmer/requests/:id – Delete my request
Admin Routes

POST /admin/login – Admin login

POST /admin/create – Create lower-level admin or farmer

GET /admin/requests – View requests in scope

PUT /admin/requests/:id/status – Update request status

POST /admin/products – Add new product

GET /admin/products – List products
Future Improvements

Real-time notifications (WebSockets).

Multi-language support (Amharic + English).

Advanced analytics dashboard for policymakers.

Mobile-first offline-ready PWA.

