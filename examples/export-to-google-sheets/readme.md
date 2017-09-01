## Export to Google Sheets example

See what it does: https://youtu.be/-OaDjCxBVS4

Here is a good starting point to find any details about Google Sheets API: https://developers.google.com/sheets/api/quickstart/nodejs

#### 1. Getting Google API secret (don't be scared, you have to do this once :):
- Use [this wizard](https://console.developers.google.com/start/api?id=sheets.googleapis.com) to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.
- On the Add credentials to your project page, click the Cancel button.
- At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
- Select the Credentials tab, click the Create credentials button and select OAuth client ID.
- Select the application type Other, enter the name "Google Sheets API Quickstart", and click the Create button.
- Click OK to dismiss the resulting dialog.
- Click the 🡇 (Download JSON) button to the right of the client ID.
- Move this file to your working directory and rename it secret.json.

#### 2. Install Node.js modules
```sh
npm i 
```

### 3. Run the main script the first time to get the auth token

```sh
./index.js --auth
```

Later, the script will use the saved token, so you wouldn't need to run through authorization process every time.

### 4. Replace the SHOTTY credentials inside the script

```js
require('shotty-api')('<YOUR-SHOTTY-URL>', '<YOUR-SHOTTY-SECRET>'),
```

### 5. Run the main script with the project and/or the spreadsheet ids

```sh
./index.js -p PROJECTID -s SPREADSHEETID
```

