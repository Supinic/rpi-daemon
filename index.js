(function () {
	const mail = require("sendmail")();
	const pm = require("/usr/lib/node_modules/pm2");

	const scripts = {};
	const threshold = 3;

	pm.launchBus((err, bus) => {
		bus.on("log:err", ({at, data, process}) => {
			if (process.name === "daemon") {
				return;
			}

			if (data && data.includes("Debugger attached")) {
				if (typeof scripts[process.name] === "undefined") {
					scripts[process.name] = {
						counter: 0,
						messages: []
					};
				}

				scripts[process.name].counter++;
				scripts[process.name].messages.push({
					timestamp: at,
					date: new Date(at).toJSON(),
					message: data
				});
			}
		});
	});

	setInterval(() => {
		for (const key of Object.keys(scripts)) {
			const data = scripts[key];
			if (data.counter > threshold) {
				mail({
					from: "daemon@rpi.dev",
					to: "supinic@protonmail.com",
					subject: `Daemon: process "${key}" restarted ${data.counter} times!`,
					html: JSON.stringify(data.messages, null, 4)
				});
			}

			data.counter = 0;
			data.messages = [];
		}

	}, 60_000);
})();
