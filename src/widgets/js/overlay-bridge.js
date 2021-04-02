
class WidgetBridge
{
	constructor()
	{
		this.variables = {}
		this.events = {}

		window.addEventListener('message', (event) =>
		{
			if (event.data.variable)
			{
				this.variables.add(event.data.variable);
			}
			else if (event.data.params)
			{
				//TODO: Send params
			}
		})
	}

	addDependency(variableName, source)
	{
		if (variableName in this.variables)
		{
			this.variables[variableName].sources.add(source);
		}
		else
		{
			let newDep = {
				sources: new Set()
			}
			newDep.sources.add(source);
			this.variables[variableName] = newDep;

			//Request over websocket?
		}

		this.socket.send(JSON.stringify({
			state: [variableName]
		}))
	}

	addEvent(eventName, source)
	{
		if (eventName in this.variables)
		{
			this.events[eventName].sources.add(source);
		}
		else
		{
			let newDep = {
				sources: new Set()
			}
			newDep.sources.add(source);
			this.events[eventName] = newDep;
		}
	}

	connect()
	{
		// TODO: This address needs to be dynamic!
		this.socket = new WebSocket(`ws://${window.location.host}`);

		this.socket.addEventListener('message', (event) =>
		{
			let msg = JSON.parse(event.data);

			if ("state" in msg)
			{
				let varName = msg.state.name;
				if (varName in this.state)
				{
					for (let source of this.state[varName].sources)
					{
						source.postMessage({
							state: {
								name: varName,
								value: msg.variable.value
							}
						})
					}
				}
			}
			if ("event" in msg)
			{
				let eventName = msg.event.name;
				if (eventName in this.events)
				{
					for (let source of this.events[eventName].sources)
					{
						source.postMessage({
							event: {
								name: eventName,
								payload: msg.event.payload
							}
						})
					}
				}
			}
		})

		this.socket.addEventListener('open', () =>
		{
			console.log("Connected");
			this.emit("connected", null);
		});

		this.socket.addEventListener('close', () =>
		{
			setTimeout(() =>
			{
				console.log("Connection Closed: Attempting Reconnect");
				this.socket = null;
				this.connect();
			}, 1000);
		});

		this.socket.addEventListener('error', () =>
		{
			this.socket.close(); //Use close here instead so there's not a double reconnect.
		});
	}

	on(event, func)
	{
		if (event in this.callbacks)
		{
			this.callbacks[event].push(func);
		}
		else
		{
			this.callbacks[event] = [func];
		}
	}

	emit(event, payload)
	{
		if (event in this.callbacks)
		{
			for (let func of this.callbacks[event])
			{
				try
				{
					func(payload);
				}
				catch (err)
				{
					console.error(err);
				}
			}
		}
	}
}


const widget = new WidgetBridge();