from shotty import api

# import logging
# logging.getLogger('requests').setLevel(logging.WARNING)
# logging.basicConfig(level=logging.DEBUG)

backend = api('localhost', '54342a78-e2e8f65f-8040ae5f-5a01fe75-66909b98', 9102)
backend.changes('users')
