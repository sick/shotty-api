Install Node https://nodejs.org/en/download/current/

Go to examples dir and install dependencies

```
cd <directory_with_examples> && npm i
```

Replace `your-api-key` with your API key from SHOTTY settings and `you-shotty-url` with your SHOTTY url

And then to verify if everything was successful run script with help option -h

```node <script.js> -h```

For example for upload-version.js output will be like this

```
  Usage: upload-version [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -d, --dir <path>         Directory with versions to upload, default is current dir
    -g, --glob ["pattern"]   Glob pattern, default is "*.mov"
    -p, --project <project>  Project code value
    -s, --status <status>    Status for new shots, default "new"
```


```
# Upload every *.mov file as new shot for project with code terminator
node upload-version.js -d /media/your-source-dir/ -p terminator
```
