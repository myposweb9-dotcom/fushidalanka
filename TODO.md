# TODO

- [ ] Fix logo type mismatch: routes/index.js (`logobar` -> `logo`) so `/products` shows same logos as global middleware.
- [ ] Clean up routes/index.js: remove in-handler `require('../models/Content')` (avoid shadowing) and use top-level import.
- [ ] Fix password reset raw SQL table name in routes/user.js (use correct Sequelize table name instead of hardcoding `users`).
- [ ] Validate EJS partial `views/partials/header_new.ejs` encoding/contents (file appears corrupted). Replace with a correct version if needed.
- [ ] Run server and hit: `/products` and `/user/reset-password/:token` to confirm runtime errors are gone.

