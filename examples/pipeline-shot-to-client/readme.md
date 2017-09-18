## Pipline example #1

Uploading an approved version to FTP server and sending notifications to `superusers` and users specified in command line.

---

### How to try:

1. `npm i`
2. Add your FTP server settings to `ftp.json` (available options are described [here](https://github.com/mscdex/node-ftp#methods))
3. Add your SHOTTY settings to `shotty.json` (only `host` and `secret`)
4. Launch the script:
```sh
./index.js -p <project code> -u <user email or id>,<another user email or id>,...
```
