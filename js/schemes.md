## Shotty API — DB objects schemes

### chats
```
id: <string>
date: <date>
projectId: <string>
shotId: <string>
userId: <string>
type: <string> - `plain` (default), `file`, `status`, `task`, `version`
text: <string>, default - ''
meta: <object>, default - {}
	{url: <string>, name: <string>, size: <uint>} — `file`
	{shotStatus: <string>} — `status`
	{activity: <string>, assigneeId: <string>, description: <string>} — `task`
	{versionId: <string>} — `version`
```


### lists
```
id: <string>
projectId: <string>
creatorId: <string> - user id
title: <string> - should be unique
shots: <array> of <string> - shots ids
```


### notifications
```
id: <string>
date: <date>
userId: <string>
text: <string>
url: <string> — without domain
iconUrl: <string> — without domain
previewUrl: <string> — without domain
```


### projects
```
id: <string> - human readable
code: <string> - the same as `id`
_dbVersion: <int>, default - `1`
date: <date> - creation date
dates:
	start: <date>
	end: <date>
creatorId: <string> - user id
delimiter: <string>, default - `_`
workdays: <array> of <int>, default - `[1, 2, 3, 4, 5]` (starting with Monday)
workhours:
	start: <string>, default - `10:00`
	end: <string>, default - `19:00`
title: <string>
team: <array> of <string>, default - `[project.creatorId]` - users ids
eye: <string>, default - null
poster: <string> — url, default - null
description: <string>
color: <string>, default - null
format: <object>
fps: <float>, default - 25
genre: <string>, default - null
paths:
	root: <string>, default - null
	lut: <string>, default - null
versionTypes: <array> of <object>
	label: <string>
	path: <string>
taskLevels: <array> of <object>
tasksStatuses: <array> of <object>
```


### shots
```
id: <string>
date: <date>
projectId: <string>
sequence: <string>
code: <string>
creatorId: <string> - user id
description: <string>, default - ``
type: <string>, `shot` | `asset`, default - `shot`
status: <string>, default - null
meta: <string>, default - null
timecode: <string>, default - null
stereo: <bool>, default - false
eye: <string>, default - null
```

- projectId + sequence + code = secondary key, should be unique


### sprints
```
id: <string>
name: <string>
start: <date>
end: <date>
team: <string> — team id
tasks: <array> of <string> — task ids
changes: <array> of <object>:
	date: <date>
	count: <int> - quantity of completed tasks
```


### tasks
```
id: <string>
date: <date>
projectId: <string>
shotId: <string> or null
creatorId: <string> - user id
assigneeId: <string> or null - user id
description: <string>, default - ``
hours: <int> or null
activity: <string>
status: <string>, id of status
timeline:
	started: <date> or null - not applicable now
	completed: <date> or null - being set when task appears in the last column
reviews: <array> of <string> - todos ids, should be renamed into `todos`
meta: unspecified <object>
```


### teams
```
id: <string>
name: <string>, unique
avatar: <string> - url
users: <array> of <string> - uids
```

### todos (ex-reviews)
```
id: <string>
date: <date>
projectId: <string>
shotId: <string>
versionId: <string>
creatorId: <string> - user id
description: <string>
timestamp: <int>, default - 0
drawingData: <string> or null
drawingSize: <object> or null
thumbnailUrl: <string> or null - url without domain name
thumbnailKey: <string> or null - DEPRECATED
meta:
	done: <bool>, default - false
	pinned: <bool>, default - false	
	priority: <int>, default - 0
```

### users
```
id: <string>
active: <bool>, default value is in settings
role: <string>, default value is in settings
realname: <string> or null
telegramId: <string> or null
created: <date>
avatar: <string> or null
local:
	email: <string>,
	password: <string>
```

- local.email = secondary key, should be unique


### versions
```
id: <string>
storageId: <string> - id of the record in storage db
date: <date>
projectId: <string>
shotId: <string>
creatorId: <string> - user id
name: <string>
description: <string>
type: <string>
tasks: <array> of <string> - tasks ids
iteration: <int>
status: <string>
file:
	url: <string> - unique part of the path to the original file
	size: <int> - size of the original file in bytes
	type: <string> - `video` or `image`
	preview: <string> - filename of converted file (picture or video)
	frames: <array> of <string> - preview frames for video files
	basepath: <string>
	processingError: <string> or null - error returned by Encoder
	meta: unspecified <object>
```
