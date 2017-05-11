from socketIO_client import SocketIO, LoggingNamespace, BaseNamespace
import requests
import json
import os.path

class api:
	def __init__(self, host, secret, port=443):
		self.host = host
		self.port = int(port)
		self.user = ''
		self.protocol = 'https' if self.port == 443 else 'http'
		self.serverUrl = '%s://%s:%i' % (self.protocol, self.host, self.port)
		self._uploaderUrl = '%s://%s:%i' % (self.protocol, self.host, 9201)
		self.secret = secret
		self.jwt = False
		self.types = ['users', 'chats', 'tasks', 'todos', 'versions', 'shots', 'projects', 'lists']
		self._connect()

	def _connect(self):
		r = requests.post('%s/backend/api/authBySecret' % self.serverUrl, json={'secret': self.secret}, verify=False)
		resp = json.loads(r.text)
		if resp['error']:
			raise ValueError('Can`t authenticate with given secret')
		else:
			print 'shotty api authenticated'
			self.jwt = resp['data']['token']

	def _on_socket_response(self, *args):
		resp = json.loads(args[0].split(',', 1)[1])
		print('_on_socket_response', resp)


	def changes(self, namespace):
		if namespace not in self.types:
			raise ValueError('wrong type of changes requested')


		socket = SocketIO(self.serverUrl,
				 self.port,
				 resource='socket',
				 params={'token': self.jwt},
				 verify=False)

		socket.define(BaseNamespace, '/'+namespace)
		socket.on('message', self._on_socket_response)

		socket.wait() # Wait forever.

	def get(self, what, id=False, projectId=False, shotId=False, versionId=False):
		if what not in self.types:
			raise ValueError('wrong type of data requested')

		payload = {
			'token': self.jwt,
			'type': what,
			'id': id,
			'projectId': projectId,
			'shotId': shotId,
			'versionId': versionId
		}
		r = requests.post('%s/backend/api/get' % self.serverUrl, json=payload, verify=False)
		resp = json.loads(r.text)
		if resp['error']:
			raise ValueError('got error %s' % resp['desc'])
		else:
			return resp['data']

	def post(self, what, data):
		if what not in ['versions']:
			raise ValueError('wrong type of data requested')

		path, filename = os.path.split(data['file'])

		file = {
			'file': open(data['file'], 'rb')
		}

		payload = {
			'secret': self.secret,
			'projectId': data['projectId'],
			'shotId': data['shotId'],
			'name': filename,
			'iteration': 0,
			'creatorId': data['creatorId'],
			'description': data['description'] if data['description'] else '',
			'type': data['type']
		}

		r = requests.post('%s/upload/version' % self.serverUrl, files=file, data=payload)
		resp = json.loads(r.text)
		if resp['error']:
			raise ValueError('got error %s' % resp['desc'])
		else:
			return resp['data']