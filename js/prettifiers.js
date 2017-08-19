'use strict';

module.exports = {
	project: project => {
	 	if(!project.title)
	 		project.title = project.code;

		if(!project.paths) {
			project.paths = {
				root: null,
				luts: null
			};
		}

		if(!project.dates || !project.dates.start || !project.dates.end) {
			project.dates = {
				start: project.dates && project.dates.start || new Date(),
				end: project.dates && project.dates.end || new Date() + 2628000000 // a month
			};
		}

		if(!project.tasksStatuses || !project.tasksStatuses.length) {
			project.tasksStatuses = [
				{id: Date.now() + '1', name:'backlog', color: '#cccccc'},
				{id: Date.now() + '2', name:'progress', color: '#2780E3'},
				{id: Date.now() + '3', name:'done', color: '#59AE5A'}
			];
		}
		else if(!project.tasksStatuses[0].id)
			project.tasksStatuses = project.tasksStatuses.map((ts, idx) => Object.assign(ts, {id: Date.now() + idx}));

		project.fps = parseFloat(project.fps) || 25;

		if(!project.workhours)
			project.workhours = {start: '10:00', end: '19:00'};

		if(!project.workdays || !project.workdays.length)
			project.workdays = [1, 2, 3, 4, 5];

		if(!project.creatorId)
			project.creatorId = null;

		return project;
	}
};
