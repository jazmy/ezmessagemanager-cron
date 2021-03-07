***Update Environment Variables***

Rename .env.example to .env

    MAIL_TRAP_USER=1e0c15eb327e34
    MAIL_TRAP_USER_PASS_WORD=16cdcc11cdf63a
    EmailFrom= no-reply@jaz.com
    STRAPI_APP_SERVER_URL=http://localhost:1337/
    PORT_NUM=4000
    origin=http://localhost:3000
***Please note***

ORIGIN means the URL to frontend server
STRAPI_APP_SERVER_URL means the URL to backend server.



***Install Dependencies***
    yarn
    npm install pm2 -g
***Run Cron Service***
    pm2 start index.js
    pm2 list
    pm2 logs
***Stop cron service***
    pm2 delete all
    pm2 kill
***Refresh cron service***
    pm2 restart all
**kill the port when done testing***
npx kill-port 4000


***DEVELOPER NOTES***

startAllCompaignsBackup is a file for backup if we need to step down.


