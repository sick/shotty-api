from socketIO_client import SocketIO, LoggingNamespace, BaseNamespace
import requests
import json

class api:
	def __init__(self, host, secret, port=443):

		self.host = host
		self.port = int(port)
		self.protocol = 'https' if self.port == 443 else 'http'
		self.serverUrl = '%s://%s:%i' % (self.protocol, self.host, self.port)
		self.secret = secret
		self.jwt = False
		self._connect()

	def _connect(self):
		r = requests.post('%s/backend/api/authBySecret' % self.serverUrl, json={'secret': self.secret})
		resp = json.loads(r.text)
		if resp['error']:
			raise ValueError('Can`t authenticate with given secret')
		else:
			print 'shotty api authenticated', resp['data']['token']
			self.jwt = resp['data']['token']

	def _on_socket_response(self, *args):
		print('_on_socket_response', json.loads(args[0].split(',', 1)[1]))


	def changes(self, namespace):
		if namespace not in ['users',
							 'chats',
							 'tasks',
							 'todos',
							 'versions',
							 'shots',
							 'projects',
							 'lists']:
			raise ValueError('wrong type of changes requested')


		socket = SocketIO(self.serverUrl,
				 self.port,
				 resource='socket',
				 params={'token': self.jwt},
				 verify=False)

		socket.define(BaseNamespace, '/'+namespace)
		socket.on('message', self._on_socket_response)

		socket.wait() # Wait forever.

