define([
	'require',
	'dojo/Deferred',
	'./lib/args',
	'./lib/util'
], function (require, Deferred, args, util) {
	var grepRegex;

	return {
		/**
		 * The mode in which Intern is currently running. Either 'client' or 'runner'.
		 */
		mode: null,

		/**
		 * The arguments received from the environment for the current test run.
		 */
		args: args,

		/**
		 * The configuration data in use for the current test run.
		 */
		config: null,

		/**
		 * Maximum number of suites to run concurrently. Currently used only by the server-side runner.
		 */
		maxConcurrency: Infinity,

		/**
		 * Suites to run. Each suite defined here corresponds to a single environment.
		 */
		suites: [],

		/**
		 * Runs all environmental suites concurrently, with a concurrency limit.
		 */
		run: function () {
			var dfd = new Deferred(),
				queue = util.createQueue(this.maxConcurrency),
				numSuitesCompleted = 0,
				numSuitesToRun = this.suites.length;

			this.suites.forEach(queue(function (suite) {
				return suite.run().always(function () {
					if (++numSuitesCompleted === numSuitesToRun) {
						dfd.resolve();
					}
					else {
						console.log('%d environments left to test', numSuitesToRun - numSuitesCompleted);
					}
				});
			}));

			return dfd.promise;
		},

		/**
		 * Filter tests based on test ID
		 */
		grep: function (test) {
			if (!grepRegex) {
				if (this.args.grep) {
					grepRegex = new RegExp(this.args.grep);
				}
				else if (this.config.grep) {
					grepRegex = this.config.grep;
				}
				else {
					grepRegex = /.*/;
				}
			}
			return grepRegex.test(test.id);
		},

		/**
		 * Traverse and print the set of registered tests
		 */
		listTests: function (suite) {
			var i, tests, test;

			if (!suite) {
				for (i = 0; i < this.suites.length; i++) {
					this.listTests(this.suites[i]);
				}
			}
			else {
				tests = suite.tests;
				for (i = 0; i < tests.length; i++) {
					test = tests[i];
					if (test.tests) {
						this.listTests(test);
					}
					else {
						console.log(test.id);
					}
				}
			}
		},

		/**
		 * AMD plugin API interface for easy loading of test interfaces.
		 */
		load: function (id, parentRequire, callback) {
			require([ './lib/interfaces/' + id ], callback);
		}
	};
});
