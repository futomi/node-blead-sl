'use strict';
const BleadSl = require('../lib/blead-sl.js');
const blead = new BleadSl();

blead.discover({
	//id: 'd2:72:d2:42:c7:43',
	//id: 'd272d242c743',
	//quick: true,
	//duration: 10000
}).then((list) => {
	list.forEach((dev) => {
		console.log(dev);
	});
}).catch((error) => {
	console.error(error);
}).finally(() => {
	process.exit();
});