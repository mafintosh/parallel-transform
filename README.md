# parallel-transform

Transform stream for Node.js that allows you to run your transforms
in parallel without changing the order.

	npm install parallel-transform

It is easy to use

``` js
var transform = require('parallel-transform');

var stream = transform(10, function(data, callback) { // 10 is the parallism level
	setTimeout(function() {
		callback(null, data);
	}, Math.random() * 1000);
});

for (var i = 0; i < 10; i++) {
	stream.write(''+i);
}
stream.end();

stream.on('data', function(data) {
	console.log(data.toString()); // prints 0,1,2,...
});
stream.on('end', function() {
	console.log('stream has ended');
});
```

If you run the above example you'll notice that it runs in parallel
(does not take ~1 second between each print) and that the order is preserved

## Stream options

It you want to pass in any transform stream options (like `objectMode`) pass them as the
second parameter

``` js
var stream = transform(10, {objectMode:true}, function(data, callback) {
	// the stream is now in objectMode and data can be an object
});
```

## License

MIT