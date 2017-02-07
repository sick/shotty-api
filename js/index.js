'use strict';

const request = require('request'),
	io = require('socket.io-client');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = (...args) => new (class Shotty {
	constructor(host, secret, port = 443, protocol) {
		this._host = host;
		this._port = parseInt(port);
		this._protocol = protocol ? protocol : (this._port === 443 ? 'https' : 'http');
		this._serverUrl = `${this._protocol}://${this._host}:${this._port}`;
		this._secret = secret;
		this._jwt = null;

		this._request = (url, data) => new Promise((resolve, reject) =>
			request({
				url: `${this._serverUrl}/backend/api/${url}`,
				method: 'POST',
				json: data
			})
			.on('error', reject)
			.on('response', response => response.on('data', data => resolve(JSON.parse(data))))
		);
	}

	static get _version() {
		return '0.0.1';
	}

	_indexOf(data, id) {
		if(data.length <= 0) return -1;
		let idx = 0;
		for(; idx < data.length; idx++) {
			if(data[idx].id === id) break;
		}
		return idx;
	}

	isF(f) {
		return typeof f === 'function';
	}

	_updateData(data, changes) {
		let idx = changes.old_val ? this._indexOf(changes.old_val.id) : data.length;

		if(changes.new_val)
			data[idx] = changes.new_val;
		else
			data.splice(idx, 1);

		return data;
	}

	connect() {
		return new Promise((resolve, reject) =>
			this._request('authBySecret', {secret: this._secret})
			.then(result =>
				!result.error
					? resolve({desc: 'authenticated with secret', data: this._jwt = result.data.token})
					: reject({desc: 'can`t authenticate with given secret', result})
			)
			.catch(result => reject({desc: 'could not authenticate with secret due to connection error', data: result}))
		);
	}

	changes(type, initCallbacks = {}) {
		if(!(type in {users: 1, chats: 1, tasks: 1, reviews: 1, versions: 1, shots: 1, projects: 1, lists: 1}))
			return {error: true, desc: 'wrong type of changes requested'};

		const launchCallback = (changes, type) => {
			if(type === 'init' && this.isF(c._onInit))
				return c._onInit(c.data);

			if(type === 'changes') {
				if(this.isF(c._onChange))
					c._onChange(changes.new_val, changes.old_val, c.data);

				if(changes.new_val && changes.old_val && this.isF(c._onUpdate))
					return c._onUpdate(changes.new_val, changes.old_val, c.data);

				if(!changes.new_val && changes.old_val && this.isF(c._onRemove))
					return c._onRemove(changes.old_val, c.data);

				if(changes.new_val && !changes.old_val && this.isF(c._onAdd))
					return c._onAdd(changes.new_val, c.data);
			}
		};

		let c = {
			_onInit: initCallbacks.onInit || null,
			_onChange: initCallbacks.onChange || null,
			_onAdd: initCallbacks.onAdd || null,
			_onRemove: initCallbacks.onRemove || null,
			_onUpdate: initCallbacks.onUpdate || null,
			_onConnect: initCallbacks.onConnect || null,
			_onDisconnect: initCallbacks.onDisconnect || null,
			onInit: callback => { c._onInit = callback; return c; },
			onChange: callback => { c._onChange = callback; return c; },
			onAdd: callback => { c._onAdd = callback; return c; },
			onRemove: callback => { c._onRemove = callback; return c; },
			onUpdate: callback => { c._onUpdate = callback; return c; },
			onDisconnect: callback => { c._onDisconnect = callback; return c; },
			disconnect: () => c.socket.emit('disconnect'),
			data: [],
			socket: io(`${this._serverUrl}/${type}`, {
				'force new connection': true,
				path: '/socket',
				query: 'token=' + this._jwt
			})
		};

		c.socket
		.on('connect', this.isF(c._onConnect) ? c._onConnect : () => {})
		.on('disconnect', (...args) => {
			c.data = [];
			if(this.isF(c._onDisconnect))
				c._onDisconnect(...args);
		})
		.on(type, payload => {
			if(payload.type === 'keepalive') {
				c.socket.emit('keepalive', 1);
				return;
			}

			if(payload.type === 'init')
				c.data = payload.data;
			else if(payload.type === 'changes' && payload.data)
				c.data = this._updateData(c.data, payload.data);

			launchCallback(payload.data, payload.type);
		});

		return c;
	}
})(...args);
