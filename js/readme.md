## Shotty API helper — JS


#### Install:
`$ npm i shotty-api --save`


### Require and initialize:
```js
const shotty = require('shotty-api')('shotty.local', 'your-secret-key');
```


### Connect:
```js
shotty.connect().then(connectData => ...).catch(error => ...)
```


### Changes feed:
```js
shotty.changes(type, {onConnect: () => ...})
.onInit(items => ...)
.onAdd((newItem, allItems) => ...)
.onRemove((removedItem, allItems) => ...)
.onUpdate((newItem, oldItem, allItems) => ...)
.onDisconnect(() => ...);
```

Available _types_:
- `users`
- `chats`
- `tasks`
- `todos`
- `versions`
- `shots`
- `projects`
- `lists`
- `settings`

`allItems` is an array in which _shotty_ object holds all actual items of the `type`.


### One-time requests:
```js
shotty.get.user(id).then(item => ...).catch(error => ...)
shotty.get.users().then(items => ...).catch(error => ...)

shotty.get.chat(id).then(item => ...).catch(error => ...)
shotty.get.chats(projectId, shotId).then(items => ...).catch(error => ...)

shotty.get.task(id).then(item => ...).catch(error => ...)
shotty.get.tasks(projectId, shotId).then(items => ...).catch(error => ...)

shotty.get.todo(id).then(item => ...).catch(error => ...)
shotty.get.todos(projectId, shotId, versionId).then(items => ...).catch(error => ...)

shotty.get.version(id).then(item => ...).catch(error => ...)
shotty.get.versions(projectId, shotId).then(items => ...).catch(error => ...)

shotty.get.shot(id).then(item => ...).catch(error => ...)
shotty.get.shots(projectId, shotId).then(items => ...).catch(error => ...)

shotty.get.project(id).then(item => ...).catch(error => ...)
shotty.get.projects(projectId).then(items => ...).catch(error => ...)

shotty.get.list(id).then(item => ...).catch(error => ...)
shotty.get.lists(projectId).then(items => ...).catch(error => ...)

shotty.get.settings().then(items => ...).catch(error => ...)
```

`id` is obligatory.

`projectId`, `shotId` and `versionId` are optional.

--

### Example
```js
const shotty = require('shotty-api')('shotty.local', 'your-secret-key');

shotty.connect()
.then(async result => {
	// feeds
	shotty.changes('shots', {onConnect: () => console.info('socket connected')})
	.onInit(items => console.info('got init data', items.length))
	.onAdd((item, all) => console.info('got new item', item, all.length))
	.onRemove((item, all) => console.info('an item was removed', item, all.length))
	.onUpdate((newItem, oldItem, all) => console.info('an item has been updated', oldItem, newItem, all.length))
	.onDisconnect((...args) => console.info('changes feed disconnected', ...args))

	// one-time get request for versions of project `test` and shot `3cd7c189-fda3-46c8-bb0c-742e6aa24efe`
	shotty.get.versions('test', '3cd7c189-fda3-46c8-bb0c-742e6aa24efe')
	.then(items => console.log('got versions', items))
	.catch(error => console.error(error));

	// you can use async/await syntax with the .get functions
	let users = await shotty.get.users();
})
.catch(error => console.error(error));
```
