
class WidgetBridge
{
	constructor()
	{
		this.params = {}
		window.addEventListener('message', (event) =>
		{
			if (event.data.params)
			{
				//Do something with these?
				this.params = event.data.params;
			}
			else if (event.data.state)
			{
				//Trigger update to the DOM
			}
			else if (event.data.event)
			{
				//Trigger function
				this.emit(event.data.event.name, event.data.event.payload);
			}
		})
	}

	init()
	{
		window.parent.postMessage({ params: null });
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

	addDependency(variableName)
	{
		window.parent.postMessage({
			variable: variableName
		})
	}
}


const widget = new WidgetBridge();