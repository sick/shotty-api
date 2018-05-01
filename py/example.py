from shotty import api
# import logging
# logging.getLogger('requests').setLevel(logging.WARNING)
# logging.basicConfig(level=logging.DEBUG)

import sys, traceback, json

def response_wrapper(resp):
	if len(resp):
		get = json.loads(resp[0].split(',', 1)[1])
		return get[1]['type'], get[1]['data']
	else:
		return None, None

def main():
    try:
		# shotty = api('localhost', '54342a78-e2e8f65f-8040ae5f-5a01fe75-66909b98', 9102)
		shotty = api('demo.shottyapp.com', 'a5cf1c75-4f863909-c632683e-5a0e820d-731eb5be')

		users = shotty.get('users') # get all users
		for u in users: print 'user %s, role is %s' % (u['realname'], u['role'])
		# shotty.get('users', id='785845fjdfg930459') # get one user
		# shotty.changes('users') # get realtime updates for all users

		shotty.get('projects') # get all projects
		p = shotty.get('projects', id='28p') # get one project
		# print p['paths']['root']
		# shotty.changes('users') # get realtime updates for all users

		# shotty.get('shots', id='54342a78-e2e8f65f-8040ae5f') # get one shot
		shots = shotty.get('shots') # get all shots for all project
		shots = shotty.get('shots', projectId='28p') # get all shots for test project
		print 'Total shots count %s' % len(shots)
		print 'Shots with client status', len([shot for shot in shots if shot['status'] == 'client'])

		def _do_something_with_shots(*args):
			what, shots = response_wrapper(args)
			print what, len(shots)

		def _do_something_with_tasks(*args):
			what, tasks = response_wrapper(args)
			print what, tasks

		# shotty.changes('shots', _do_something_with_shots) # get realtime updates for all shots
		shotty.changes('tasks', _do_something_with_tasks) # get realtime updates for all shots

		# shotty.get('versions', id='54342a78-e2e8f65f-8040ae5f') # get one version
		versions = shotty.get('versions', projectId='28p') # get all versions for test project
		print 'dailies versions', len([version for version in versions if version['type'] == 'dailies'])
		# shotty.get('versions', shotId='748324hfsd904') # get all versions for one shot
		# shotty.changes('versions') # get realtime updates for all versions


    except KeyboardInterrupt:
        print "Shutdown requested...exiting"
    except Exception:
        traceback.print_exc(file=sys.stdout)
    sys.exit(0)

if __name__ == "__main__":
    main()




