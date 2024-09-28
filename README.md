# LolaCine Backend - Voting System API

This repository contains the backend code for the **LolaCine 2024 Voting System**, developed for a local event where schools present short films and participate in an electronic voting system. This backend handles **proposal submissions**, **voting**, and **administration functions**.

### Key Features:
- **Express.js Server**: Manages requests and interacts with the frontend.
- **MySQL Database**: Stores proposals, user votes, and state of the voting.
- **Firebase Authentication**: Secure login for admins and users.
- **Voting Logic**: Restricts users to one vote per user and checks if voting is enabled.

### Backend Code:
1. **Database Setup**: 
   - Uses `mysql2` to connect to a MySQL database, creating tables for `votos`, `users`, and `state` [`database.js`](https://github.com/GhostixGameDev/LolaCine-Backend/blob/main/src/database.js).

.
2. **Voting Management**:
   - Routes are defined to enable or disable voting, check vote status, and submit votes [`server.js`](https://github.com/GhostixGameDev/LolaCine-Backend/blob/main/src/server.js).
3. **Authentication**:
   - Firebase is used for user and admin verification via tokens.

This backend is integrated with the [LolaCine Frontend](https://github.com/GhostixGameDev/LolaCine-Frontend), which enables users to vote through a React-based interface. **Note**: The backend is hosted on free-tier services, so it may take a few moments to wake up.
