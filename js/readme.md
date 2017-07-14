## Shotty API helper — JS


#### Install:
`$ npm i shotty-api --save`


### Object types:
- `users`
- `chats`
- `tasks`
- `todos`
- `versions`
- `shots`
- `projects`
- `lists`


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


### Writing changes

#### Creating
```js
shotty.create(type, object)
```

#### Editing
```js
shotty.edit(type, id, changes)
shotty.edit(type, {id: objectId, ...changes})
```

#### Deleting
```js
shotty.delete(type, id)
```

All three functions return promises.
`type` can be any of the available types except `users`.

Object schemes are [here](./schemes.md).

---

### Examples

#### Feeds and one-time requests
```js
const shotty = require('shotty-api')('shotty.local', 'your-secret-key');

shotty.connect()
.then(async result => { // async is only for `await`
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


#### Writing with promises
```js
const timeout = f => setTimeout(f, 1000);

timeout(() =>
	shotty.create('shot', {projectId: 'demo', sequence: 'api', code: '001', creatorId: null})
	.then(shot => {
		console.log('created shot', shot.id);

		timeout(() =>
			shotty.edit('shot', shot.id, {description: 'test'})
			.then(editedShot => {
				console.log('edited shot', editedShot.id);

				timeout(() =>
					shotty.edit('shot', {id: shot.id, description: 'test2'})
					.then(editedShot => {
						console.log('edited shot again', editedShot.id);

						timeout(() =>
							shotty.delete('shot', editedShot.id)
							.then(result => console.log('deleted shot', result))
							.catch(error => console.error('cannot delete shot', error))
						);
					})
					.catch(error => console.error('cannot edit shot second time', error))
				);
			})
			.catch(error => console.error('cannot edit shot', error))
		);
	})
	.catch(error => console.error('cannot create shot', error))
);
```

#### Writing with `async/await` functions
```js
// don't forget to wrap promises with try/catch blocks
const timeout = f => setTimeout(f, 1000);

timeout(async () => {
	let shot = await shotty.create('shot', {projectId: 'demo', sequence: 'api', code: '001', creatorId: null});
	console.log('created shot', shot.id);

	timeout(async () => {
		let editedShot = await shotty.edit('shot', shot.id, {description: 'test'});
		console.log('edited shot', editedShot.id);

		timeout(async () => {
			let editedShot = await shotty.edit('shot', {id: shot.id, description: 'test 2'});
			console.log('edited shot again', editedShot.id);

			timeout(async () => {
				let count = await shotty.delete('shot', editedShot.id);
				console.log('deleted shot', count);
			});
		});
	});
});
```
